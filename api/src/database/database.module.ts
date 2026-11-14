import { Global, Injectable, Module, OnApplicationShutdown } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Pool } from 'pg';

@Injectable()
export class Database extends Pool implements OnApplicationShutdown {
  constructor(config: ConfigService) {
    super({ connectionString: config.getOrThrow<string>('DATABASE_URL'), connectionTimeoutMillis: 5000, statement_timeout: 10000, max: 10 });
    this.on('error', () => console.error('Unexpected idle PostgreSQL connection error'));
  }
  async onApplicationShutdown() { await this.end(); }
}

@Global()
@Module({ providers: [Database], exports: [Database] })
export class DatabaseModule {}
