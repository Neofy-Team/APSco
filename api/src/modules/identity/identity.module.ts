import { Module } from '@nestjs/common';
import { APP_FILTER } from '@nestjs/core';
import { AccessTokens, AdminGuard } from './access-tokens';
import { BearerChallengeFilter } from './bearer-challenge.filter';

@Module({
  providers: [AccessTokens, AdminGuard, { provide: APP_FILTER, useClass: BearerChallengeFilter }],
  exports: [AccessTokens, AdminGuard],
})
export class IdentityModule {}
