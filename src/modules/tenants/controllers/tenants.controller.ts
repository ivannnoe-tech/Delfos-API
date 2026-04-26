import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiCreatedResponse, ApiOkResponse, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { IsMongoId } from 'class-validator';

import { PaginationQueryDto } from '../../../core/dto/pagination-query.dto';
import { CreateTenantDto } from '../dto/create-tenant.dto';
import { TenantListResponseDto, TenantResponseDto } from '../dto/tenant-response.dto';
import { UpdateTenantDto } from '../dto/update-tenant.dto';
import { TenantsService } from '../services/tenants.service';

class TenantIdParamDto {
  @IsMongoId()
  id!: string;
}

@ApiTags('tenants')
@Controller('api/v1/tenants')
export class TenantsController {
  constructor(private readonly tenantsService: TenantsService) {}

  @Post()
  @ApiOperation({
    summary: 'Create a tenant foundation record.',
    description:
      'Temporary administrative foundation endpoint. Real authentication and authorization must be added before production.',
  })
  @ApiCreatedResponse({ type: TenantResponseDto })
  create(@Body() dto: CreateTenantDto): Promise<TenantResponseDto> {
    return this.tenantsService.create(dto);
  }

  @Get()
  @ApiOperation({
    summary: 'List tenants.',
    description:
      'Temporary administrative foundation endpoint. Real authentication and authorization must be added before production.',
  })
  @ApiOkResponse({ type: TenantListResponseDto })
  findAll(@Query() query: PaginationQueryDto): Promise<TenantListResponseDto> {
    return this.tenantsService.findAll(query.page, query.pageSize);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get one tenant.',
    description:
      'Temporary administrative foundation endpoint. Real authentication and authorization must be added before production.',
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
      'Temporary administrative foundation endpoint. Real authentication and authorization must be added before production.',
  })
  @ApiParam({ name: 'id' })
  @ApiOkResponse({ type: TenantResponseDto })
  update(
    @Param() params: TenantIdParamDto,
    @Body() dto: UpdateTenantDto,
  ): Promise<TenantResponseDto> {
    return this.tenantsService.update(params.id, dto);
  }
}
