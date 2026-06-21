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
import { ConnectionListResponseDto, ConnectionResponseDto } from '../dto/connection-response.dto';
import { ConnectionTenantQueryDto, ListConnectionsQueryDto } from '../dto/connection-query.dto';
import { CreateConnectionDto } from '../dto/create-connection.dto';
import { UpdateConnectionDto } from '../dto/update-connection.dto';
import { ConnectionsService } from '../services/connections.service';

class ConnectionIdParamDto {
  @IsEntityId()
  id!: string;
}

@ApiTags('connections')
@ApiFoundationAuthHeaders()
@UseGuards(AdminKeyGuard, AdminRolesGuard)
@Controller('api/v1/connections')
export class ConnectionsController {
  constructor(private readonly connectionsService: ConnectionsService) {}

  @Post()
  @ApiOperation({
    summary: 'Create a customer API connection configuration.',
    description:
      'Protected by temporary foundation admin-key auth. It stores metadata and credential references only.',
  })
  @AdminRoles(AdminRole.Owner, AdminRole.Admin, AdminRole.Operator)
  @ApiCreatedResponse({ type: ConnectionResponseDto })
  create(
    @Body() dto: CreateConnectionDto,
    @Req() request: AuthenticatedRequest,
  ): Promise<ConnectionResponseDto> {
    return this.connectionsService.create(dto, this.toActorContext(request));
  }

  @Get()
  @ApiOperation({
    summary: 'List connection configurations by tenant.',
    description:
      'Protected by temporary foundation admin-key auth. No external API call is performed.',
  })
  @ApiOkResponse({ type: ConnectionListResponseDto })
  findByTenant(@Query() query: ListConnectionsQueryDto): Promise<ConnectionListResponseDto> {
    return this.connectionsService.findByTenant(query.tenantId, query.page, query.pageSize);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get one connection configuration.',
    description:
      'Protected by temporary foundation admin-key auth. No external API call is performed.',
  })
  @ApiParam({ name: 'id' })
  @ApiOkResponse({ type: ConnectionResponseDto })
  findOne(
    @Param() params: ConnectionIdParamDto,
    @Query() query: ConnectionTenantQueryDto,
  ): Promise<ConnectionResponseDto> {
    return this.connectionsService.findOne(query.tenantId, params.id);
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Update a connection configuration.',
    description:
      'Protected by temporary foundation admin-key auth. Raw secrets must not be sent or stored here.',
  })
  @AdminRoles(AdminRole.Owner, AdminRole.Admin, AdminRole.Operator)
  @ApiParam({ name: 'id' })
  @ApiOkResponse({ type: ConnectionResponseDto })
  update(
    @Param() params: ConnectionIdParamDto,
    @Query() query: ConnectionTenantQueryDto,
    @Body() dto: UpdateConnectionDto,
    @Req() request: AuthenticatedRequest,
  ): Promise<ConnectionResponseDto> {
    return this.connectionsService.update(
      query.tenantId,
      params.id,
      dto,
      this.toActorContext(request),
    );
  }

  private toActorContext(request: AuthenticatedRequest): { actorId?: string } {
    return {
      actorId: request.delfosAuthContext?.actorId,
    };
  }
}
