import { Global, Module } from '@nestjs/common';

import { AppConfigModule } from '../../config/app-config.module';
import { AdminKeyGuard } from './guards/admin-key.guard';
import { AdminRolesGuard } from './guards/admin-roles.guard';
import { RequestAuthContextService } from './services/request-auth-context.service';

@Global()
@Module({
  imports: [AppConfigModule],
  providers: [AdminKeyGuard, AdminRolesGuard, RequestAuthContextService],
  exports: [AdminKeyGuard, AdminRolesGuard, RequestAuthContextService],
})
export class AuthModule {}
