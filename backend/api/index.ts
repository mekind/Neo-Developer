import { NestFactory } from '@nestjs/core';
import { ExpressAdapter } from '@nestjs/platform-express';
import { ValidationPipe, INestApplication } from '@nestjs/common';
import express, { Request, Response } from 'express';
import { AppModule } from '../src/app.module';

const server = express();
let app: INestApplication | null = null;

async function bootstrap(): Promise<express.Express> {
  if (app) return server;
  app = await NestFactory.create(AppModule, new ExpressAdapter(server));
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  app.enableCors();
  await app.init();
  return server;
}

export default async function handler(req: Request, res: Response) {
  const expressApp = await bootstrap();
  expressApp(req, res);
}
