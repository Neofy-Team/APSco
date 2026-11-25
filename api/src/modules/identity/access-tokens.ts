import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { createHash } from 'node:crypto';
import { Database } from '../../database/database.module';
import { BearerUnauthorizedException } from './bearer-challenge.filter';

@Injectable()
export class AccessTokens {
  constructor(private readonly database: Database) {}

  async requireAdmin(authorization: string | undefined) {
    const token = authorization?.match(/^Bearer +([A-Za-z0-9_-]{43})$/i)?.[1];
    if (!token) throw new BearerUnauthorizedException(/^Bearer(?: |$)/i.test(authorization ?? ''));

    const hash = createHash('sha256').update(token).digest();
    const { rows: [account] } = await this.database.query<{ role: 'admin' | 'customer' }>(
      `SELECT account.role
       FROM account_access_tokens AS token
       JOIN accounts AS account ON account.id = token.account_id
       WHERE token.token_hash = $1 AND token.expires_at > now()`,
      [hash],
    );
    if (!account) throw new BearerUnauthorizedException(true);
    if (account.role !== 'admin') throw new ForbiddenException('Admin access required');
  }
}

@Injectable()
export class AdminGuard implements CanActivate {
  constructor(private readonly tokens: AccessTokens) {}

  async canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest<{ headers: { authorization?: string } }>();
    await this.tokens.requireAdmin(request.headers.authorization);
    return true;
  }
}
