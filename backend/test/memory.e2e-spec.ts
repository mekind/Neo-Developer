import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { createTestApp } from './utils/test-app';

describe('Memory (BE-03)', () => {
  let app: INestApplication;
  let userId: string;

  beforeAll(async () => {
    app = await createTestApp();
    const res = await request(app.getHttpServer()).post('/users').send({});
    userId = res.body.id;
  });

  afterAll(async () => {
    await app.close();
  });

  it('PUT memory parses frontmatter from body when not provided', async () => {
    const body =
      '---\ntone: friendly\nnotification: morning\n---\n\n# Preferences\n';
    const res = await request(app.getHttpServer())
      .put(`/users/${userId}/memory/preferences`)
      .send({ body })
      .expect(200);
    expect(res.body.path).toBe('preferences');
    expect(res.body.body).toBe(body);
    expect(res.body.frontmatter).toMatchObject({
      tone: 'friendly',
      notification: 'morning',
    });
  });

  it('PUT memory uses explicit frontmatter when provided', async () => {
    const res = await request(app.getHttpServer())
      .put(`/users/${userId}/memory/agents/abc/SOUL`)
      .send({
        body: 'whatever',
        frontmatter: { greetings_alert: ['hi'], formality: '반말' },
      })
      .expect(200);
    expect(res.body.frontmatter).toMatchObject({ formality: '반말' });
  });

  it('GET memory index lists paths without bodies', async () => {
    const res = await request(app.getHttpServer())
      .get(`/users/${userId}/memory`)
      .expect(200);
    const paths = res.body.map((d: { path: string }) => d.path).sort();
    expect(paths).toEqual(['agents/abc/SOUL', 'preferences']);
    for (const item of res.body) {
      expect(item.body).toBeUndefined();
    }
  });

  it('GET memory/:path returns single document', async () => {
    const res = await request(app.getHttpServer())
      .get(`/users/${userId}/memory/preferences`)
      .expect(200);
    expect(res.body.path).toBe('preferences');
    expect(res.body.body).toContain('# Preferences');
  });

  it('GET memory/:path 404 for missing doc', async () => {
    await request(app.getHttpServer())
      .get(`/users/${userId}/memory/does-not-exist`)
      .expect(404);
  });

  it('POST log appends entries with newest at top', async () => {
    await request(app.getHttpServer())
      .post(`/users/${userId}/log`)
      .send({ message: 'first' })
      .expect(201);

    await request(app.getHttpServer())
      .post(`/users/${userId}/log`)
      .send({ message: 'second', link: 'profile' })
      .expect(201);

    const res = await request(app.getHttpServer())
      .get(`/users/${userId}/memory/log`)
      .expect(200);

    const lines = res.body.body.split('\n').filter(Boolean);
    expect(lines[0]).toBe('# Activity Log');
    expect(lines[1]).toContain('second');
    expect(lines[1]).toContain('[[profile]]');
    expect(lines[2]).toContain('first');
  });

  it('memory routes 404 for unknown user', async () => {
    await request(app.getHttpServer())
      .get('/users/00000000-0000-0000-0000-000000000000/memory')
      .expect(404);
    await request(app.getHttpServer())
      .put('/users/00000000-0000-0000-0000-000000000000/memory/x')
      .send({ body: 'no' })
      .expect(404);
  });
});
