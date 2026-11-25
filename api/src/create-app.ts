import 'reflect-metadata';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import helmet from 'helmet';
import { AppModule } from './app.module';

function parseMoneyAmount(this: { currency?: unknown }, key: string, value: unknown, context?: { source: string }) {
  if (key !== 'amount' || typeof this.currency !== 'string' || typeof value !== 'number' || !context) {
    return value;
  }
  // Validate integer syntax before any rounding and retain the full int64 range.
  if (!/^-?[0-9]{1,19}$/.test(context.source)) return NaN;
  return Number.isSafeInteger(value) ? value : BigInt(context.source);
}

export async function createApp() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  const config = app.get(ConfigService);
  app.use(helmet());
  app.useBodyParser('json', { reviver: parseMoneyAmount });
  app.setGlobalPrefix('api/v1');
  app.enableCors({ origin: config.get<string[]>('CORS_ORIGINS') ?? [], exposedHeaders: ['WWW-Authenticate'] });
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }));
  return app;
}
