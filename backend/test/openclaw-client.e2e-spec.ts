import { GatewayTimeoutException, ServiceUnavailableException } from '@nestjs/common';
import { OpenclawClient } from '../src/openclaw/openclaw.client';
import { InvokeRequest } from '../src/openclaw/openclaw.types';

const sampleInvoke: InvokeRequest = {
  user_id: 'u_1',
  agent_id: 'a_1',
  input: 'hi',
  trigger: 'message',
  context: {
    soul: {},
    config: {},
    memory_snapshot: { profile: null, preferences: null, interests: [], recent_history: [] },
  },
};

function makeResponse(body: unknown, init: Partial<{ status: number; ok: boolean }> = {}): Response {
  const status = init.status ?? 200;
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
    text: async () => JSON.stringify(body),
  } as unknown as Response;
}

describe('OpenclawClient', () => {
  it('throws ServiceUnavailable when env not set', async () => {
    const client = new OpenclawClient({ baseUrl: '', token: '' });
    await expect(client.invoke(sampleInvoke)).rejects.toBeInstanceOf(ServiceUnavailableException);
  });

  it('sends Bearer token and parses JSON response', async () => {
    const fetchImpl = jest.fn().mockResolvedValue(
      makeResponse({ reply: 'ok', used_skills: [], refused: null }),
    );
    const client = new OpenclawClient({
      baseUrl: 'https://oc.test/',
      token: 'tok',
      fetchImpl: fetchImpl as unknown as typeof fetch,
      retries: 0,
    });

    const res = await client.invoke(sampleInvoke);

    expect(res.reply).toBe('ok');
    expect(fetchImpl).toHaveBeenCalledTimes(1);
    const [url, init] = fetchImpl.mock.calls[0];
    expect(url).toBe('https://oc.test/api/invoke');
    expect((init as RequestInit).method).toBe('POST');
    expect((init as RequestInit).headers).toMatchObject({
      Authorization: 'Bearer tok',
      'Content-Type': 'application/json',
    });
  });

  it('retries once on 5xx then succeeds', async () => {
    const fetchImpl = jest
      .fn()
      .mockResolvedValueOnce(makeResponse({ error: 'boom' }, { status: 502 }))
      .mockResolvedValueOnce(makeResponse({ reply: 'ok', used_skills: [], refused: null }));
    const client = new OpenclawClient({
      baseUrl: 'https://oc.test',
      token: 'tok',
      fetchImpl: fetchImpl as unknown as typeof fetch,
      retries: 1,
    });

    const res = await client.invoke(sampleInvoke);

    expect(res.reply).toBe('ok');
    expect(fetchImpl).toHaveBeenCalledTimes(2);
  });

  it('maps timeout (AbortError) to GatewayTimeoutException', async () => {
    const fetchImpl = jest.fn().mockImplementation((_url, init: RequestInit) => {
      return new Promise((_resolve, reject) => {
        init.signal?.addEventListener('abort', () => {
          const err = new Error('aborted');
          (err as Error & { name: string }).name = 'AbortError';
          reject(err);
        });
      });
    });
    const client = new OpenclawClient({
      baseUrl: 'https://oc.test',
      token: 'tok',
      fetchImpl: fetchImpl as unknown as typeof fetch,
      timeoutMs: 10,
      retries: 0,
    });

    await expect(client.invoke(sampleInvoke)).rejects.toBeInstanceOf(GatewayTimeoutException);
  });
});
