import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { createTestApp } from './utils/test-app';

describe('Greetings (BE-06)', () => {
  let app: INestApplication;
  let userId: string;
  let agentId: string;

  const approachGreetings = ['왔어?', '오 안녕!', '뭐 찾아?'];
  const alertGreetings = ['오! 새 소식 있어!', '잠깐!'];

  beforeAll(async () => {
    app = await createTestApp();
    const userRes = await request(app.getHttpServer()).post('/users').send({});
    userId = userRes.body.id;

    const agentRes = await request(app.getHttpServer())
      .post(`/users/${userId}/agents`)
      .send({
        name: 'greeter',
        persona: {},
        soul: {
          greetings_alert: alertGreetings,
          greetings_approach: approachGreetings,
        },
        config: {},
      });
    agentId = agentRes.body.id;
  });

  afterAll(async () => {
    await app.close();
  });

  it('returns one of the configured approach greetings', async () => {
    const res = await request(app.getHttpServer())
      .get(`/users/${userId}/agents/${agentId}/greeting?type=approach`)
      .expect(200);
    expect(res.body.type).toBe('approach');
    expect(approachGreetings).toContain(res.body.text);
  });

  it('returns one of the configured alert greetings', async () => {
    const res = await request(app.getHttpServer())
      .get(`/users/${userId}/agents/${agentId}/greeting?type=alert`)
      .expect(200);
    expect(alertGreetings).toContain(res.body.text);
  });

  it('shows variety across multiple calls', async () => {
    const seen = new Set<string>();
    for (let i = 0; i < 30; i++) {
      const res = await request(app.getHttpServer())
        .get(`/users/${userId}/agents/${agentId}/greeting?type=approach`)
        .expect(200);
      seen.add(res.body.text);
    }
    expect(seen.size).toBeGreaterThan(1);
  });

  it('rejects invalid type with 400', async () => {
    await request(app.getHttpServer())
      .get(`/users/${userId}/agents/${agentId}/greeting?type=bogus`)
      .expect(400);
  });

  it('returns 404 for unknown agent', async () => {
    await request(app.getHttpServer())
      .get(
        `/users/${userId}/agents/00000000-0000-0000-0000-000000000000/greeting?type=alert`,
      )
      .expect(404);
  });

  it('returns text=null when SOUL has no greetings array', async () => {
    const empty = await request(app.getHttpServer())
      .post(`/users/${userId}/agents`)
      .send({ name: 'silent', persona: {}, soul: {}, config: {} });
    const silentId = empty.body.id;

    const res = await request(app.getHttpServer())
      .get(`/users/${userId}/agents/${silentId}/greeting?type=approach`)
      .expect(200);
    expect(res.body.text).toBeNull();
  });
});
