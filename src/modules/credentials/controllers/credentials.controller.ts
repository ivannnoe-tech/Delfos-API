import { Body, Controller, Get, Param, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import {
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { IsEntityId } from '../../../core/validation/is-entity-id.decorator';
import { AdminRoles } from '../../auth/decorators/admin-roles.decorator';
import { ApiFoundationAuthHeaders } from '../../auth/decorators/api-foundation-auth-headers.decorator';
import { AdminKeyGuard } from '../../auth/guards/admin-key.guard';
import { AdminRolesGuard } from '../../auth/guards/admin-roles.guard';
import { AdminRole } from '../../auth/types/admin-role';
import { AuthenticatedRequest } from '../../auth/types/authenticated-request';
import { CreateCredentialDto } from '../dto/create-credential.dto';
import { CredentialTenantQueryDto, ListCredentialsQueryDto } from '../dto/credential-query.dto';
import { CredentialListResponseDto, CredentialResponseDto } from '../dto/credential-response.dto';
import { RotateCredentialDto } from '../dto/rotate-credential.dto';
import { CredentialsService } from '../services/credentials.service';

class CredentialIdParamDto {
  @IsEntityId()
  id!: string;
}

@ApiTags('credentials')
@ApiFoundationAuthHeaders()
@UseGuards(AdminKeyGuard, AdminRolesGuard)
@Controller('api/v1/credentials')
export class CredentialsController {
  constructor(private readonly credentialsService: CredentialsService) {}

  @Post()
  @ApiOperation({
    summary: 'Create a protected credential reference.',
    description:
      'Protected by temporary foundation admin-key auth. secretValue is protected locally and never returned.',
  })
  @AdminRoles(AdminRole.Owner, AdminRole.Admin)
  @ApiCreatedResponse({ type: CredentialResponseDto })
  create(
    @Body() dto: CreateCredentialDto,
    @Req() request: AuthenticatedRequest,
  ): Promise<CredentialResponseDto> {
    return this.credentialsService.create(dto, this.toActorContext(request));
  }

  @Get()
  @ApiOperation({
    summary: 'List credential metadata by tenant.',
    description:
      'Protected by temporary foundation admin-key auth. It returns only credentialRef and safe metadata.',
  })
  @ApiOkResponse({ type: CredentialListResponseDto })
  findByFilters(@Query() query: ListCredentialsQueryDto): Promise<CredentialListResponseDto> {
    return this.credentialsService.findByFilters(query);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get credential metadata.',
    description:
      'Protected by temporary foundation admin-key auth. It never returns protected or raw secret values.',
  })
  @ApiParam({ name: 'id' })
  @ApiOkResponse({ type: CredentialResponseDto })
  findOne(
    @Param() params: CredentialIdParamDto,
    @Query() query: CredentialTenantQueryDto,
  ): Promise<CredentialResponseDto> {
    return this.credentialsService.findOne(query.tenantId, params.id);
  }

  @Patch(':id/rotate')
  @ApiOperation({
    summary: 'Rotate a credential secret value.',
    description:
      'Protected by temporary foundation admin-key auth. The new secretValue is protected and never returned.',
  })
  @AdminRoles(AdminRole.Owner, AdminRole.Admin)
  @ApiParam({ name: 'id' })
  @ApiOkResponse({ type: CredentialResponseDto })
  rotate(
    @Param() params: CredentialIdParamDto,
    @Query() query: CredentialTenantQueryDto,
    @Body() dto: RotateCredentialDto,
    @Req() request: AuthenticatedRequest,
  ): Promise<CredentialResponseDto> {
    return this.credentialsService.rotate(
      query.tenantId,
      params.id,
      dto,
      this.toActorContext(request),
    );
  }

  @Patch(':id/revoke')
  @ApiOperation({
    summary: 'Revoke a credential.',
    description:
      'Protected by temporary foundation admin-key auth. This marks the credential as revoked without exposing secret values.',
  })
  @AdminRoles(AdminRole.Owner, AdminRole.Admin)
  @ApiParam({ name: 'id' })
  @ApiOkResponse({ type: CredentialResponseDto })
  revoke(
    @Param() params: CredentialIdParamDto,
    @Query() query: CredentialTenantQueryDto,
    @Req() request: AuthenticatedRequest,
  ): Promise<CredentialResponseDto> {
    return this.credentialsService.revoke(query.tenantId, params.id, this.toActorContext(request));
  }

  private toActorContext(request: AuthenticatedRequest): { actorId?: string } {
    return {
      actorId: request.delfosAuthContext?.actorId,
    };
  }
}
