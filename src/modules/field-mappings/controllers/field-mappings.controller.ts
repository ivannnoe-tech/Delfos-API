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
@ApiFoundationAuthHeaders()
@UseGuards(AdminKeyGuard, AdminRolesGuard)
@Controller('api/v1/field-mappings')
export class FieldMappingsController {
  constructor(private readonly fieldMappingsService: FieldMappingsService) {}

  @Post()
  @ApiOperation({
    summary: 'Create a field mapping.',
    description:
      'Protected by temporary foundation admin-key auth. It stores only De/Para configuration and never processes customer data.',
  })
  @AdminRoles(AdminRole.Owner, AdminRole.Admin, AdminRole.Operator)
  @ApiCreatedResponse({ type: FieldMappingResponseDto })
  create(
    @Body() dto: CreateFieldMappingDto,
    @Req() request: AuthenticatedRequest,
  ): Promise<FieldMappingResponseDto> {
    return this.fieldMappingsService.create(dto, this.toActorContext(request));
  }

  @Get()
  @ApiOperation({
    summary: 'List field mappings.',
    description:
      'Protected by temporary foundation admin-key auth. tenantId remains explicit until final authorization exists.',
  })
  @ApiOkResponse({ type: FieldMappingListResponseDto })
  findByFilters(@Query() query: ListFieldMappingsQueryDto): Promise<FieldMappingListResponseDto> {
    return this.fieldMappingsService.findByFilters(query);
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Update a field mapping.',
    description:
      'Protected by temporary foundation admin-key auth. It does not execute analytical transformations.',
  })
  @AdminRoles(AdminRole.Owner, AdminRole.Admin, AdminRole.Operator)
  @ApiParam({ name: 'id' })
  @ApiOkResponse({ type: FieldMappingResponseDto })
  update(
    @Param() params: FieldMappingIdParamDto,
    @Query() query: FieldMappingTenantQueryDto,
    @Body() dto: UpdateFieldMappingDto,
    @Req() request: AuthenticatedRequest,
  ): Promise<FieldMappingResponseDto> {
    return this.fieldMappingsService.update(
      query.tenantId,
      params.id,
      dto,
      this.toActorContext(request),
    );
  }

  @Delete(':id')
  @ApiOperation({
    summary: 'Deactivate a field mapping.',
    description:
      'Protected by temporary foundation admin-key auth. This is a soft delete via inactive status.',
  })
  @AdminRoles(AdminRole.Owner, AdminRole.Admin, AdminRole.Operator)
  @ApiParam({ name: 'id' })
  @ApiOkResponse({ type: FieldMappingResponseDto })
  deactivate(
    @Param() params: FieldMappingIdParamDto,
    @Query() query: FieldMappingTenantQueryDto,
    @Req() request: AuthenticatedRequest,
  ): Promise<FieldMappingResponseDto> {
    return this.fieldMappingsService.deactivate(
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
