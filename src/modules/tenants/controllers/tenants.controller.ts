import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import {
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { IsEntityId } from '../../../core/validation/is-entity-id.decorator';
import { PaginationQueryDto } from '../../../core/dto/pagination-query.dto';
import { AdminRoles } from '../../auth/decorators/admin-roles.decorator';
import { ApiFoundationAuthHeaders } from '../../auth/decorators/api-foundation-auth-headers.decorator';
import { AdminKeyGuard } from '../../auth/guards/admin-key.guard';
import { AdminRolesGuard } from '../../auth/guards/admin-roles.guard';
import { AdminRole } from '../../auth/types/admin-role';
import { CreateTenantDto } from '../dto/create-tenant.dto';
import { TenantListResponseDto, TenantResponseDto } from '../dto/tenant-response.dto';
import { UpdateTenantDto } from '../dto/update-tenant.dto';
import { TenantsService } from '../services/tenants.service';

class TenantIdParamDto {
  @IsEntityId()
  id!: string;
}

@ApiTags('tenants')
@ApiFoundationAuthHeaders()
@UseGuards(AdminKeyGuard, AdminRolesGuard)
@Controller('api/v1/tenants')
export class TenantsController {
  constructor(private readonly tenantsService: TenantsService) {}

  @Post()
  @ApiOperation({
    summary: 'Create a tenant foundation record.',
    description:
      'Protected by temporary foundation admin-key auth. This is not the final production authentication strategy.',
  })
  @AdminRoles(AdminRole.Owner, AdminRole.Admin, AdminRole.Operator)
  @ApiCreatedResponse({ type: TenantResponseDto })
  create(@Body() dto: CreateTenantDto): Promise<TenantResponseDto> {
    return this.tenantsService.create(dto);
  }

  @Get()
  @ApiOperation({
    summary: 'List tenants.',
    description:
      'Protected by temporary foundation admin-key auth. This is not the final production authentication strategy.',
  })
  @ApiOkResponse({ type: TenantListResponseDto })
  findAll(@Query() query: PaginationQueryDto): Promise<TenantListResponseDto> {
    return this.tenantsService.findAll(query.page, query.pageSize);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get one tenant.',
    description:
      'Protected by temporary foundation admin-key auth. This is not the final production authentication strategy.',
  })
  @ApiParam({ name: 'id' })
  @ApiOkResponse({ type: TenantResponseDto })
  findOne(@Param() params: TenantIdParamDto): Promise<TenantResponseDto> {
    return this.tenantsService.findOne(params.id);
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Update a tenant foundation record.',
    description:
      'Protected by temporary foundation admin-key auth. This is not the final production authentication strategy.',
  })
  @AdminRoles(AdminRole.Owner, AdminRole.Admin, AdminRole.Operator)
  @ApiParam({ name: 'id' })
  @ApiOkResponse({ type: TenantResponseDto })
  update(
    @Param() params: TenantIdParamDto,
    @Body() dto: UpdateTenantDto,
  ): Promise<TenantResponseDto> {
    return this.tenantsService.update(params.id, dto);
  }
}
