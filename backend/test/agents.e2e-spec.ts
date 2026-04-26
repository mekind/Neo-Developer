import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { createTestApp } from './utils/test-app';

const persona = { description: '파란 베레모 부엉이' };
const soul = {
  formality: '반말',
  greetings_alert: ['오! 새 소식 있어!', '잠깐! 이거 봐봐'],
  greetings_approach: ['왔어?', '오 안녕!', '뭐 찾아?'],
};
const config = { skills: ['insane-search'], schedule: '0 8 * * *' };

describe('Agents (BE-04)', () => {
  let app: INestApplication;
  let userId: string;
  const agentIds: string[] = [];

  beforeAll(async () => {
    app = await createTestApp();
    const res = await request(app.getHttpServer()).post('/users').send({});
    userId = res.body.id;
  });

  afterAll(async () => {
    await app.close();
  });

  it('creates 3 agents successfully', async () => {
    for (let i = 0; i < 3; i++) {
      const res = await request(app.getHttpServer())
        .post(`/users/${userId}/agents`)
        .send({ name: `agent-${i}`, persona, soul, config })
        .expect(201);
      expect(res.body).toMatchObject({
        name: `agent-${i}`,
        status: 'active',
      });
      expect(res.body.persona).toMatchObject(persona);
      expect(res.body.soul).toMatchObject({ formality: '반말' });
      agentIds.push(res.body.id);
    }
  });

  it('rejects 4th agent with 409 (3-agent limit)', async () => {
    const res = await request(app.getHttpServer())
      .post(`/users/${userId}/agents`)
      .send({ name: '4th', persona, soul, config })
      .expect(409);
    expect(res.body.message).toContain('3개');
  });

  it('GET list returns 3 agents with persona', async () => {
    const res = await request(app.getHttpServer())
      .get(`/users/${userId}/agents`)
      .expect(200);
    expect(res.body).toHaveLength(3);
    for (const agent of res.body) {
      expect(agent.persona).toMatchObject(persona);
    }
  });

  it('GET single agent returns persona/soul/config', async () => {
    const res = await request(app.getHttpServer())
      .get(`/users/${userId}/agents/${agentIds[0]}`)
      .expect(200);
    expect(res.body.persona).toMatchObject(persona);
    expect(res.body.soul.greetings_approach).toHaveLength(3);
    expect(res.body.config.skills).toEqual(['insane-search']);
  });

  it('PATCH updates name and persona document', async () => {
    const res = await request(app.getHttpServer())
      .patch(`/users/${userId}/agents/${agentIds[0]}`)
      .send({ name: 'renamed', persona: { description: '바뀐 외형' } })
      .expect(200);
    expect(res.body.name).toBe('renamed');
    expect(res.body.persona).toMatchObject({ description: '바뀐 외형' });
  });

  it('DELETE removes agent and frees a slot', async () => {
    await request(app.getHttpServer())
      .delete(`/users/${userId}/agents/${agentIds[0]}`)
      .expect(200);

    const list = await request(app.getHttpServer())
      .get(`/users/${userId}/agents`)
      .expect(200);
    expect(list.body).toHaveLength(2);

    const res = await request(app.getHttpServer())
      .post(`/users/${userId}/agents`)
      .send({ name: '4th-after-delete', persona, soul, config })
      .expect(201);
    expect(res.body.name).toBe('4th-after-delete');
  });

  it('rejects invalid create payload (400)', async () => {
    await request(app.getHttpServer())
      .post(`/users/${userId}/agents`)
      .send({ name: '', persona, soul, config })
      .expect(400);

    await request(app.getHttpServer())
      .post(`/users/${userId}/agents`)
      .send({ name: 'ok', persona: 'not-an-object', soul, config })
      .expect(400);
  });

  it('agents routes 404 for unknown user', async () => {
    await request(app.getHttpServer())
      .get('/users/00000000-0000-0000-0000-000000000000/agents')
      .expect(404);
  });
});
