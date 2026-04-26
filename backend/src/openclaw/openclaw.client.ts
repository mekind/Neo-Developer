import {
  BadGatewayException,
  GatewayTimeoutException,
  Inject,
  Injectable,
  Logger,
  Optional,
  ServiceUnavailableException,
} from '@nestjs/common';
import {
  InvokeRequest,
  InvokeResponse,
  TickRequest,
  TickResponse,
} from './openclaw.types';

export interface OpenclawClientOptions {
  baseUrl?: string;
  token?: string;
  timeoutMs?: number;
  retries?: number;
  fetchImpl?: typeof fetch;
}

export const OPENCLAW_OPTIONS = Symbol('OPENCLAW_OPTIONS');

const DEFAULT_TIMEOUT_MS = 15_000;
const DEFAULT_RETRIES = 1;
const RETRY_BASE_DELAY_MS = 250;

@Injectable()
export class OpenclawClient {
  private readonly logger = new Logger(OpenclawClient.name);
  private readonly baseUrl: string;
  private readonly token: string;
  private readonly timeoutMs: number;
  private readonly retries: number;
  private readonly fetchImpl: typeof fetch;

  constructor(
    @Optional() @Inject(OPENCLAW_OPTIONS) options: OpenclawClientOptions = {},
  ) {
    this.baseUrl = (options.baseUrl ?? process.env.OPENCLAW_BASE_URL ?? '').replace(/\/+$/, '');
    this.token = options.token ?? process.env.BACKEND_SERVICE_TOKEN ?? '';
    this.timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
    this.retries = options.retries ?? DEFAULT_RETRIES;
    this.fetchImpl = options.fetchImpl ?? globalThis.fetch;

    if (!this.baseUrl) {
      this.logger.warn('OPENCLAW_BASE_URL is not configured — OpenclawClient calls will fail.');
    }
    if (!this.token) {
      this.logger.warn('BACKEND_SERVICE_TOKEN is not configured — OpenclawClient calls will fail.');
    }
  }

  invoke(req: InvokeRequest): Promise<InvokeResponse> {
    return this.request<InvokeResponse>('POST', '/api/invoke', req);
  }

  tick(req: TickRequest): Promise<TickResponse> {
    return this.request<TickResponse>('POST', '/api/tick', req);
  }

  health(): Promise<unknown> {
    return this.request<unknown>('GET', '/api/health');
  }

  private async request<T>(method: string, path: string, body?: unknown): Promise<T> {
    if (!this.baseUrl) {
      throw new ServiceUnavailableException('OPENCLAW_BASE_URL is not configured');
    }
    if (!this.token) {
      throw new ServiceUnavailableException('BACKEND_SERVICE_TOKEN is not configured');
    }

    const url = `${this.baseUrl}${path}`;
    const maxAttempts = this.retries + 1;
    let lastError: unknown;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), this.timeoutMs);
      try {
        const res = await this.fetchImpl(url, {
          method,
          headers: {
            Authorization: `Bearer ${this.token}`,
            'Content-Type': 'application/json',
            Accept: 'application/json',
          },
          body: body !== undefined ? JSON.stringify(body) : undefined,
          signal: controller.signal,
        });

        if (!res.ok) {
          const text = await safeReadText(res);
          if (res.status >= 500 && attempt < maxAttempts) {
            lastError = new BadGatewayException(`OpenClaw ${res.status}: ${text}`);
            await this.backoff(attempt);
            continue;
          }
          throw new BadGatewayException(`OpenClaw ${res.status}: ${text}`);
        }

        return (await res.json()) as T;
      } catch (err) {
        const isAbort = (err as { name?: string })?.name === 'AbortError';
        if (isAbort) {
          lastError = new GatewayTimeoutException(`OpenClaw request timed out after ${this.timeoutMs}ms`);
        } else {
          lastError = err;
        }
        if (attempt >= maxAttempts) break;
        if (!isRetryable(err)) break;
        await this.backoff(attempt);
      } finally {
        clearTimeout(timer);
      }
    }

    throw lastError instanceof Error
      ? lastError
      : new BadGatewayException('OpenClaw request failed');
  }

  private backoff(attempt: number): Promise<void> {
    const delay = RETRY_BASE_DELAY_MS * 2 ** (attempt - 1);
    return new Promise((resolve) => setTimeout(resolve, delay));
  }
}

async function safeReadText(res: Response): Promise<string> {
  try {
    return await res.text();
  } catch {
    return '';
  }
}

function isRetryable(err: unknown): boolean {
  if (!err) return false;
  const name = (err as { name?: string }).name;
  if (name === 'AbortError') return true;
  const code = (err as { code?: string }).code;
  if (code && ['ECONNRESET', 'ECONNREFUSED', 'ETIMEDOUT', 'EAI_AGAIN'].includes(code)) {
    return true;
  }
  if (err instanceof BadGatewayException) return true;
  return false;
}
