import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { EnvironmentVariables, NodeEnvironment } from './environment';

@Injectable()
export class AppConfigService {
  constructor(private readonly configService: ConfigService<EnvironmentVariables, true>) {}

  get nodeEnv(): NodeEnvironment {
    return this.configService.get('NODE_ENV', { infer: true });
  }

  get port(): number {
    return this.configService.get('PORT', { infer: true });
  }

  get databaseUrl(): string {
    return this.configService.get('DELFOS_DATABASE_URL', { infer: true });
  }

  get adminKey(): string {
    return this.configService.get('DELFOS_ADMIN_KEY', { infer: true });
  }

  get corsOrigin(): string[] {
    return this.configService.get('CORS_ORIGIN', { infer: true });
  }

  get logLevel(): EnvironmentVariables['LOG_LEVEL'] {
    return this.configService.get('LOG_LEVEL', { infer: true });
  }
}
