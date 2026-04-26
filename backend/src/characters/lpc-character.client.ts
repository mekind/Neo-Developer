import {
  BadGatewayException,
  GatewayTimeoutException,
  Inject,
  Injectable,
  Logger,
  Optional,
  ServiceUnavailableException,
} from '@nestjs/common';
import { GenerateCharacterDto } from './dto/generate-character.dto';
import { CharacterResponseDto } from './dto/character-response.dto';

export interface LpcCharacterClientOptions {
  baseUrl?: string;
  timeoutMs?: number;
  retries?: number;
  fetchImpl?: typeof fetch;
}

export const LPC_CHARACTER_OPTIONS = Symbol('LPC_CHARACTER_OPTIONS');

const DEFAULT_BASE_URL = 'http://localhost:8001';
const DEFAULT_TIMEOUT_MS = 60_000; // Character generation can take up to 30s+
const DEFAULT_RETRIES = 0; // Don't retry by default for heavy operations

@Injectable()
export class LpcCharacterClient {
  private readonly logger = new Logger(LpcCharacterClient.name);
  private readonly baseUrl: string;
  private readonly timeoutMs: number;
  private readonly retries: number;
  private readonly fetchImpl: typeof fetch;

  constructor(
    @Optional() @Inject(LPC_CHARACTER_OPTIONS) options: LpcCharacterClientOptions = {},
  ) {
    this.baseUrl = (options.baseUrl ?? process.env.LPC_CHARACTER_SERVICE_URL ?? DEFAULT_BASE_URL).replace(/\/+$/, '');
    this.timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
    this.retries = options.retries ?? DEFAULT_RETRIES;
    this.fetchImpl = options.fetchImpl ?? globalThis.fetch;
  }

  async generateCharacter(dto: GenerateCharacterDto): Promise<CharacterResponseDto> {
    return this.request<CharacterResponseDto>('POST', '/generate-character', dto);
  }

  async health(): Promise<{ ok: boolean; gemini_key_set: boolean; composer_warm: boolean }> {
    return this.request<any>('GET', '/healthz');
  }

  private async request<T>(method: string, path: string, body?: unknown): Promise<T> {
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
            'Content-Type': 'application/json',
            Accept: 'application/json',
          },
          body: body !== undefined ? JSON.stringify(body) : undefined,
          signal: controller.signal,
        });

        if (!res.ok) {
          const text = await this.safeReadText(res);
          // Mapper/composer failures are 502
          if (res.status === 502) {
            throw new BadGatewayException(`LPC Service Error: ${text || 'Mapper/Composer failure'}`);
          }
          throw new BadGatewayException(`LPC Service ${res.status}: ${text}`);
        }

        try {
          return (await res.json()) as T;
        } catch (jsonErr) {
          throw new BadGatewayException(`LPC Service returned invalid JSON: ${jsonErr instanceof Error ? jsonErr.message : 'Unknown error'}`);
        }
      } catch (err) {
        if (err instanceof BadGatewayException || err instanceof GatewayTimeoutException) {
          throw err;
        }

        const isAbort = (err as { name?: string })?.name === 'AbortError';
        if (isAbort) {
          lastError = new GatewayTimeoutException(`LPC Service request timed out after ${this.timeoutMs}ms`);
        } else {
          lastError = err;
        }
        if (attempt >= maxAttempts) break;
        if (!this.isRetryable(err)) break;
        this.logger.warn(`LPC Service request failed (attempt ${attempt}/${maxAttempts}): ${err instanceof Error ? err.message : err}. Retrying...`);
        await this.backoff(attempt);
      } finally {
        clearTimeout(timer);
      }
    }

    if (lastError instanceof GatewayTimeoutException) {
      throw lastError;
    }

    throw new ServiceUnavailableException(
      `LPC Service unreachable or failed: ${lastError instanceof Error ? lastError.message : 'Unknown error'}`,
    );
  }

  private async safeReadText(res: Response): Promise<string> {
    try {
      return await res.text();
    } catch {
      return '';
    }
  }

  private isRetryable(err: unknown): boolean {
    if (!err) return false;
    const name = (err as { name?: string }).name;
    if (name === 'AbortError') return false; // Don't retry on timeout for this heavy service
    
    // Check for native fetch errors or typical connection errors
    const message = (err as { message?: string }).message;
    if (message && (message.includes('fetch failed') || message.includes('terminated'))) {
      return true;
    }

    const code = (err as { code?: string }).code;
    if (code && ['ECONNRESET', 'ECONNREFUSED', 'EAI_AGAIN', 'UND_ERR_CONNECT_TIMEOUT'].includes(code)) {
      return true;
    }
    return false;
  }

  private backoff(attempt: number): Promise<void> {
    const delay = 1000 * 2 ** (attempt - 1);
    return new Promise((resolve) => setTimeout(resolve, delay));
  }
}
