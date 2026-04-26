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
import { CreateDatasetDto } from '../dto/create-dataset.dto';
import { DatasetTenantQueryDto, ListDatasetsQueryDto } from '../dto/dataset-query.dto';
import { DatasetListResponseDto, DatasetResponseDto } from '../dto/dataset-response.dto';
import { UpdateDatasetDto } from '../dto/update-dataset.dto';
import { DatasetsService } from '../services/datasets.service';

class DatasetIdParamDto {
  @IsMongoId()
  id!: string;
}

@ApiTags('datasets')
@ApiFoundationAuthHeaders()
@UseGuards(AdminKeyGuard, AdminRolesGuard)
@Controller('api/v1/datasets')
export class DatasetsController {
  constructor(private readonly datasetsService: DatasetsService) {}

  @Post()
  @ApiOperation({
    summary: 'Create a logical dataset configuration.',
    description:
      'Protected by temporary foundation admin-key auth. It stores declarative dataset metadata only and never fetches customer data.',
  })
  @AdminRoles(AdminRole.Owner, AdminRole.Admin, AdminRole.Operator)
  @ApiCreatedResponse({ type: DatasetResponseDto })
  create(
    @Body() dto: CreateDatasetDto,
    @Req() request: AuthenticatedRequest,
  ): Promise<DatasetResponseDto> {
    return this.datasetsService.create(dto, this.toActorContext(request));
  }

  @Get()
  @ApiOperation({
    summary: 'List logical datasets.',
    description:
      'Protected by temporary foundation admin-key auth. tenantId remains explicit until final authorization exists.',
  })
  @ApiOkResponse({ type: DatasetListResponseDto })
  findByFilters(@Query() query: ListDatasetsQueryDto): Promise<DatasetListResponseDto> {
    return this.datasetsService.findByFilters(query);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get one logical dataset.',
    description:
      'Protected by temporary foundation admin-key auth. Lookup is tenant scoped and never executes a data query.',
  })
  @ApiParam({ name: 'id' })
  @ApiOkResponse({ type: DatasetResponseDto })
  findOne(
    @Param() params: DatasetIdParamDto,
    @Query() query: DatasetTenantQueryDto,
  ): Promise<DatasetResponseDto> {
    return this.datasetsService.findOne(query.tenantId, params.id);
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Update a logical dataset configuration.',
    description:
      'Protected by temporary foundation admin-key auth. It updates configuration only and never fetches customer data.',
  })
  @AdminRoles(AdminRole.Owner, AdminRole.Admin, AdminRole.Operator)
  @ApiParam({ name: 'id' })
  @ApiOkResponse({ type: DatasetResponseDto })
  update(
    @Param() params: DatasetIdParamDto,
    @Query() query: DatasetTenantQueryDto,
    @Body() dto: UpdateDatasetDto,
    @Req() request: AuthenticatedRequest,
  ): Promise<DatasetResponseDto> {
    return this.datasetsService.update(
      query.tenantId,
      params.id,
      dto,
      this.toActorContext(request),
    );
  }

  @Delete(':id')
  @ApiOperation({
    summary: 'Archive a logical dataset.',
    description:
      'Protected by temporary foundation admin-key auth. This is a soft delete via archived status.',
  })
  @AdminRoles(AdminRole.Owner, AdminRole.Admin, AdminRole.Operator)
  @ApiParam({ name: 'id' })
  @ApiOkResponse({ type: DatasetResponseDto })
  archive(
    @Param() params: DatasetIdParamDto,
    @Query() query: DatasetTenantQueryDto,
    @Req() request: AuthenticatedRequest,
  ): Promise<DatasetResponseDto> {
    return this.datasetsService.archive(query.tenantId, params.id, this.toActorContext(request));
  }

  private toActorContext(request: AuthenticatedRequest): { actorId?: string } {
    return {
      actorId: request.delfosAuthContext?.actorId,
    };
  }
}
