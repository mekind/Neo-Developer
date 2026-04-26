import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { SKILL_CATALOG } from '../src/skills/skill-catalog';
import { createTestApp } from './utils/test-app';

describe('Skills (BE-05)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    app = await createTestApp();
  });

  afterAll(async () => {
    await app.close();
  });

  it('GET /skills returns the seeded catalog', async () => {
    const res = await request(app.getHttpServer()).get('/skills').expect(200);
    const ids = res.body.map((s: { id: string }) => s.id).sort();
    const expected = SKILL_CATALOG.map((s) => s.id).sort();
    expect(ids).toEqual(expected);
  });

  it('insane-search skill carries expected metadata', async () => {
    const res = await request(app.getHttpServer()).get('/skills').expect(200);
    const insane = res.body.find(
      (s: { id: string }) => s.id === 'insane-search',
    );
    expect(insane).toBeDefined();
    expect(insane.triggers).toContain('검색');
    expect(insane.defaultParams).toMatchObject({ topK: 5 });
  });
});
