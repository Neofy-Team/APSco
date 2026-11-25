import { ArgumentsHost, Catch, UnauthorizedException } from '@nestjs/common';
import { BaseExceptionFilter, HttpAdapterHost } from '@nestjs/core';

export class BearerUnauthorizedException extends UnauthorizedException {
  constructor(readonly invalidToken: boolean) {
    super();
  }
}

@Catch(BearerUnauthorizedException)
export class BearerChallengeFilter extends BaseExceptionFilter<BearerUnauthorizedException> {
  constructor(private readonly adapterHost: HttpAdapterHost) {
    super(adapterHost.httpAdapter);
  }

  override catch(exception: BearerUnauthorizedException, host: ArgumentsHost) {
    const response = host.switchToHttp().getResponse();
    const challenge = 'Bearer realm="catalog"' + (exception.invalidToken ? ', error="invalid_token"' : '');
    this.adapterHost.httpAdapter.setHeader(response, 'WWW-Authenticate', challenge);
    super.catch(exception, host);
  }
}
