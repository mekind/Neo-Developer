import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { createTestApp } from './utils/test-app';

describe('Users (BE-02)', () => {
  let app: INestApplication;
  let userId: string;

  beforeAll(async () => {
    app = await createTestApp();
  });

  afterAll(async () => {
    await app.close();
  });

  it('POST /users issues a uuid', async () => {
    const res = await request(app.getHttpServer())
      .post('/users')
      .send({})
      .expect(201);
    expect(res.body.id).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/,
    );
    userId = res.body.id;
  });

  it('GET /users/:id returns user with profile=null', async () => {
    const res = await request(app.getHttpServer())
      .get(`/users/${userId}`)
      .expect(200);
    expect(res.body).toMatchObject({ id: userId, profile: null });
  });

  it('GET /users/:id 404 for unknown id', async () => {
    await request(app.getHttpServer())
      .get('/users/00000000-0000-0000-0000-000000000000')
      .expect(404);
  });

  it('PATCH /users/:id/profile upserts the profile', async () => {
    const res = await request(app.getHttpServer())
      .patch(`/users/${userId}/profile`)
      .send({ nickname: '수진', purpose: '마케팅', techLevel: 'medium' })
      .expect(200);
    expect(res.body).toMatchObject({
      userId,
      nickname: '수진',
      purpose: '마케팅',
      techLevel: 'medium',
    });
  });

  it('PATCH /users/:id/profile rejects invalid techLevel (400)', async () => {
    await request(app.getHttpServer())
      .patch(`/users/${userId}/profile`)
      .send({ nickname: 'x', techLevel: 'god' })
      .expect(400);
  });

  it('PATCH /users/:id/profile rejects empty nickname (400)', async () => {
    await request(app.getHttpServer())
      .patch(`/users/${userId}/profile`)
      .send({ nickname: '' })
      .expect(400);
  });

  it('GET /users/:id reflects the upserted profile', async () => {
    const res = await request(app.getHttpServer())
      .get(`/users/${userId}`)
      .expect(200);
    expect(res.body.profile).toMatchObject({ nickname: '수진' });
  });
});
