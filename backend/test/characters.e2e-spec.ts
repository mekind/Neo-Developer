import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { LpcCharacterClient } from '../src/characters/lpc-character.client';
import { PrismaService } from '../src/prisma/prisma.service';

function makeResponse(body: unknown, init: Partial<{ status: number; ok: boolean }> = {}): Response {
  const status = init.status ?? 200;
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
    text: async () => JSON.stringify(body),
  } as unknown as Response;
}

describe('Characters (e2e)', () => {
  let app: INestApplication;
  let fetchMock: jest.Mock;

  beforeEach(async () => {
    fetchMock = jest.fn();

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(LpcCharacterClient)
      .useValue(new LpcCharacterClient({
        fetchImpl: fetchMock as unknown as typeof fetch,
        baseUrl: 'http://sidecar.test',
      }))
      .overrideProvider(PrismaService)
      .useValue({
        $connect: jest.fn().mockResolvedValue(undefined),
        $disconnect: jest.fn().mockResolvedValue(undefined),
        onModuleInit: jest.fn().mockResolvedValue(undefined),
        onModuleDestroy: jest.fn().mockResolvedValue(undefined),
      })
      .compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  it('/characters/generate (POST) - success', async () => {
    const mockResponse = {
      character_png_b64: 'base64data',
      lpc_state: { some: 'state' },
      frame_map: { walk: [] },
      credits: 'Some credits',
      mapping_trace: { trace: [] },
    };

    fetchMock.mockResolvedValue(makeResponse(mockResponse));

    const response = await request(app.getHttpServer())
      .post('/characters/generate')
      .send({
        persona_md: '# Persona\nHero',
        agent_id: 'hero-bot',
      })
      .expect(201);

    expect(response.body).toEqual(mockResponse);
    expect(fetchMock).toHaveBeenCalledWith(
      'http://sidecar.test/generate-character',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({
          persona_md: '# Persona\nHero',
          agent_id: 'hero-bot',
        }),
      })
    );
  });

  it('/characters/generate (POST) - sidecar 502 error', async () => {
    fetchMock.mockResolvedValue(makeResponse({ error: 'Mapper failed' }, { status: 502 }));

    await request(app.getHttpServer())
      .post('/characters/generate')
      .send({
        persona_md: '# Persona\nHero',
        agent_id: 'hero-bot',
      })
      .expect(502);
  });

  it('/characters/health (GET)', async () => {
    const healthMock = { ok: true, gemini_key_set: true, composer_warm: false };
    fetchMock.mockResolvedValue(makeResponse(healthMock));

    const response = await request(app.getHttpServer())
      .get('/characters/health')
      .expect(200);

    expect(response.body).toEqual(healthMock);
  });
});
