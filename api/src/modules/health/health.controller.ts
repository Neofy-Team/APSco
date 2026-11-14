import { Controller, Get, ServiceUnavailableException } from '@nestjs/common';
import { Database } from '../../database/database.module';

@Controller('health')
export class HealthController {
  constructor(private readonly database: Database) {}

  @Get('live')
  live() { return { status: 'ok' }; }

  @Get('ready')
  async ready() {
    try {
      await this.database.query('SELECT 1');
      return { status: 'ok' };
    } catch {
      throw new ServiceUnavailableException('Database unavailable');
    }
  }
}
