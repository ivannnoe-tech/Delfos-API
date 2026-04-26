import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import {
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { IsMongoId } from 'class-validator';

import { CreateFieldMappingDto } from '../dto/create-field-mapping.dto';
import {
  FieldMappingTenantQueryDto,
  ListFieldMappingsQueryDto,
} from '../dto/field-mapping-query.dto';
import {
  FieldMappingListResponseDto,
  FieldMappingResponseDto,
} from '../dto/field-mapping-response.dto';
import { UpdateFieldMappingDto } from '../dto/update-field-mapping.dto';
import { FieldMappingsService } from '../services/field-mappings.service';

class FieldMappingIdParamDto {
  @IsMongoId()
  id!: string;
}

@ApiTags('field-mappings')
@Controller('api/v1/field-mappings')
export class FieldMappingsController {
  constructor(private readonly fieldMappingsService: FieldMappingsService) {}

  @Post()
  @ApiOperation({
    summary: 'Create a field mapping.',
    description:
      'Temporary administrative foundation endpoint. It stores only De/Para configuration and never processes customer data.',
  })
  @ApiCreatedResponse({ type: FieldMappingResponseDto })
  create(@Body() dto: CreateFieldMappingDto): Promise<FieldMappingResponseDto> {
    return this.fieldMappingsService.create(dto);
  }

  @Get()
  @ApiOperation({
    summary: 'List field mappings.',
    description:
      'Temporary administrative foundation endpoint. tenantId is explicit until real authorization exists.',
  })
  @ApiOkResponse({ type: FieldMappingListResponseDto })
  findByFilters(@Query() query: ListFieldMappingsQueryDto): Promise<FieldMappingListResponseDto> {
    return this.fieldMappingsService.findByFilters(query);
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Update a field mapping.',
    description:
      'Temporary administrative foundation endpoint. It does not execute analytical transformations.',
  })
  @ApiParam({ name: 'id' })
  @ApiOkResponse({ type: FieldMappingResponseDto })
  update(
    @Param() params: FieldMappingIdParamDto,
    @Query() query: FieldMappingTenantQueryDto,
    @Body() dto: UpdateFieldMappingDto,
  ): Promise<FieldMappingResponseDto> {
    return this.fieldMappingsService.update(query.tenantId, params.id, dto);
  }

  @Delete(':id')
  @ApiOperation({
    summary: 'Deactivate a field mapping.',
    description:
      'Temporary administrative foundation endpoint. This is a soft delete via inactive status.',
  })
  @ApiParam({ name: 'id' })
  @ApiOkResponse({ type: FieldMappingResponseDto })
  deactivate(
    @Param() params: FieldMappingIdParamDto,
    @Query() query: FieldMappingTenantQueryDto,
  ): Promise<FieldMappingResponseDto> {
    return this.fieldMappingsService.deactivate(query.tenantId, params.id);
  }
}
