import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { IsMongoId } from 'class-validator';

import { AdminRoles } from '../../auth/decorators/admin-roles.decorator';
import { ApiFoundationAuthHeaders } from '../../auth/decorators/api-foundation-auth-headers.decorator';
import { AdminKeyGuard } from '../../auth/guards/admin-key.guard';
import { AdminRolesGuard } from '../../auth/guards/admin-roles.guard';
import { AdminRole } from '../../auth/types/admin-role';
import { AuthenticatedRequest } from '../../auth/types/authenticated-request';
import { CreateDashboardDefinitionDto } from '../dto/create-dashboard-definition.dto';
import {
  DashboardDefinitionTenantQueryDto,
  ListDashboardDefinitionsQueryDto,
} from '../dto/dashboard-definition-query.dto';
import {
  DashboardDefinitionListResponseDto,
  DashboardDefinitionResponseDto,
} from '../dto/dashboard-definition-response.dto';
import { UpdateDashboardDefinitionDto } from '../dto/update-dashboard-definition.dto';
import { DashboardDefinitionsService } from '../services/dashboard-definitions.service';

class DashboardDefinitionIdParamDto {
  @IsMongoId()
  id!: string;
}

@ApiTags('dashboard-definitions')
@ApiFoundationAuthHeaders()
@UseGuards(AdminKeyGuard, AdminRolesGuard)
@Controller('api/v1/dashboard-definitions')
export class DashboardDefinitionsController {
  constructor(private readonly dashboardDefinitionsService: DashboardDefinitionsService) {}

  @Post()
  @ApiOperation({
    summary: 'Create a dashboard definition.',
    description:
      'Protected by temporary foundation admin-key auth. It stores declarative dashboard configuration only and never renders widgets or executes queries.',
  })
  @AdminRoles(AdminRole.Owner, AdminRole.Admin, AdminRole.Operator)
  @ApiCreatedResponse({ type: DashboardDefinitionResponseDto })
  create(
    @Body() dto: CreateDashboardDefinitionDto,
    @Req() request: AuthenticatedRequest,
  ): Promise<DashboardDefinitionResponseDto> {
    return this.dashboardDefinitionsService.create(dto, this.toActorContext(request));
  }

  @Get()
  @ApiOperation({
    summary: 'List dashboard definitions.',
    description:
      'Protected by temporary foundation admin-key auth. tenantId remains explicit until final authorization exists.',
  })
  @ApiOkResponse({ type: DashboardDefinitionListResponseDto })
  findByFilters(
    @Query() query: ListDashboardDefinitionsQueryDto,
  ): Promise<DashboardDefinitionListResponseDto> {
    return this.dashboardDefinitionsService.findByFilters(query);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get one dashboard definition.',
    description:
      'Protected by temporary foundation admin-key auth. Lookup is tenant scoped and never executes a data query.',
  })
  @ApiParam({ name: 'id' })
  @ApiOkResponse({ type: DashboardDefinitionResponseDto })
  findOne(
    @Param() params: DashboardDefinitionIdParamDto,
    @Query() query: DashboardDefinitionTenantQueryDto,
  ): Promise<DashboardDefinitionResponseDto> {
    return this.dashboardDefinitionsService.findOne(query.tenantId, params.id);
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Update a dashboard definition.',
    description:
      'Protected by temporary foundation admin-key auth. It updates configuration only and never executes queries.',
  })
  @AdminRoles(AdminRole.Owner, AdminRole.Admin, AdminRole.Operator)
  @ApiParam({ name: 'id' })
  @ApiOkResponse({ type: DashboardDefinitionResponseDto })
  update(
    @Param() params: DashboardDefinitionIdParamDto,
    @Query() query: DashboardDefinitionTenantQueryDto,
    @Body() dto: UpdateDashboardDefinitionDto,
    @Req() request: AuthenticatedRequest,
  ): Promise<DashboardDefinitionResponseDto> {
    return this.dashboardDefinitionsService.update(
      query.tenantId,
      params.id,
      dto,
      this.toActorContext(request),
    );
  }

  @Delete(':id')
  @ApiOperation({
    summary: 'Archive a dashboard definition.',
    description:
      'Protected by temporary foundation admin-key auth. This is a soft delete via archived status.',
  })
  @AdminRoles(AdminRole.Owner, AdminRole.Admin, AdminRole.Operator)
  @ApiParam({ name: 'id' })
  @ApiOkResponse({ type: DashboardDefinitionResponseDto })
  archive(
    @Param() params: DashboardDefinitionIdParamDto,
    @Query() query: DashboardDefinitionTenantQueryDto,
    @Req() request: AuthenticatedRequest,
  ): Promise<DashboardDefinitionResponseDto> {
    return this.dashboardDefinitionsService.archive(
      query.tenantId,
      params.id,
      this.toActorContext(request),
    );
  }

  private toActorContext(request: AuthenticatedRequest): { actorId?: string } {
    return {
      actorId: request.delfosAuthContext?.actorId,
    };
  }
}
