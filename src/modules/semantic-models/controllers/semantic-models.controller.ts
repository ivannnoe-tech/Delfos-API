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
import { CreateSemanticModelDto } from '../dto/create-semantic-model.dto';
import {
  ListSemanticModelsQueryDto,
  SemanticModelTenantQueryDto,
} from '../dto/semantic-model-query.dto';
import {
  SemanticModelListResponseDto,
  SemanticModelResponseDto,
} from '../dto/semantic-model-response.dto';
import { UpdateSemanticModelDto } from '../dto/update-semantic-model.dto';
import { SemanticModelsService } from '../services/semantic-models.service';

class SemanticModelIdParamDto {
  @IsMongoId()
  id!: string;
}

@ApiTags('semantic-models')
@ApiFoundationAuthHeaders()
@UseGuards(AdminKeyGuard, AdminRolesGuard)
@Controller('api/v1/semantic-models')
export class SemanticModelsController {
  constructor(private readonly semanticModelsService: SemanticModelsService) {}

  @Post()
  @ApiOperation({
    summary: 'Create a semantic model.',
    description:
      'Protected by temporary foundation admin-key auth. It stores a declarative ' +
      'semantic model (measures, dimensions, glossary, governance) only — it never ' +
      'executes measures, generates SQL or resolves against a real data source.',
  })
  @AdminRoles(AdminRole.Owner, AdminRole.Admin, AdminRole.Operator)
  @ApiCreatedResponse({ type: SemanticModelResponseDto })
  create(
    @Body() dto: CreateSemanticModelDto,
    @Req() request: AuthenticatedRequest,
  ): Promise<SemanticModelResponseDto> {
    return this.semanticModelsService.create(dto, this.toActorContext(request));
  }

  @Get()
  @ApiOperation({
    summary: 'List semantic models.',
    description:
      'Protected by temporary foundation admin-key auth. tenantId remains explicit ' +
      'until final authorization exists. Declarative metadata only.',
  })
  @ApiOkResponse({ type: SemanticModelListResponseDto })
  findByFilters(
    @Query() query: ListSemanticModelsQueryDto,
  ): Promise<SemanticModelListResponseDto> {
    return this.semanticModelsService.findByFilters(query);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get one semantic model.',
    description:
      'Protected by temporary foundation admin-key auth. Lookup is tenant scoped and ' +
      'never executes a data query.',
  })
  @ApiParam({ name: 'id' })
  @ApiOkResponse({ type: SemanticModelResponseDto })
  findOne(
    @Param() params: SemanticModelIdParamDto,
    @Query() query: SemanticModelTenantQueryDto,
  ): Promise<SemanticModelResponseDto> {
    return this.semanticModelsService.findOne(query.tenantId, params.id);
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Update a semantic model.',
    description:
      'Protected by temporary foundation admin-key auth. It updates declarative ' +
      'metadata only and never executes queries.',
  })
  @AdminRoles(AdminRole.Owner, AdminRole.Admin, AdminRole.Operator)
  @ApiParam({ name: 'id' })
  @ApiOkResponse({ type: SemanticModelResponseDto })
  update(
    @Param() params: SemanticModelIdParamDto,
    @Query() query: SemanticModelTenantQueryDto,
    @Body() dto: UpdateSemanticModelDto,
    @Req() request: AuthenticatedRequest,
  ): Promise<SemanticModelResponseDto> {
    return this.semanticModelsService.update(
      query.tenantId,
      params.id,
      dto,
      this.toActorContext(request),
    );
  }

  @Delete(':id')
  @ApiOperation({
    summary: 'Archive a semantic model.',
    description:
      'Protected by temporary foundation admin-key auth. This is a soft delete via ' +
      'archived status.',
  })
  @AdminRoles(AdminRole.Owner, AdminRole.Admin, AdminRole.Operator)
  @ApiParam({ name: 'id' })
  @ApiOkResponse({ type: SemanticModelResponseDto })
  archive(
    @Param() params: SemanticModelIdParamDto,
    @Query() query: SemanticModelTenantQueryDto,
    @Req() request: AuthenticatedRequest,
  ): Promise<SemanticModelResponseDto> {
    return this.semanticModelsService.archive(
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
