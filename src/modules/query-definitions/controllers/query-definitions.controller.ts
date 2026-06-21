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
import { IsEntityId } from '../../../core/validation/is-entity-id.decorator';
import { AdminRoles } from '../../auth/decorators/admin-roles.decorator';
import { ApiFoundationAuthHeaders } from '../../auth/decorators/api-foundation-auth-headers.decorator';
import { AdminKeyGuard } from '../../auth/guards/admin-key.guard';
import { AdminRolesGuard } from '../../auth/guards/admin-roles.guard';
import { AdminRole } from '../../auth/types/admin-role';
import { AuthenticatedRequest } from '../../auth/types/authenticated-request';
import { CreateQueryDefinitionDto } from '../dto/create-query-definition.dto';
import {
  ListQueryDefinitionsQueryDto,
  QueryDefinitionTenantQueryDto,
} from '../dto/query-definition-query.dto';
import {
  QueryDefinitionListResponseDto,
  QueryDefinitionResponseDto,
} from '../dto/query-definition-response.dto';
import { UpdateQueryDefinitionDto } from '../dto/update-query-definition.dto';
import { QueryDefinitionsService } from '../services/query-definitions.service';

class QueryDefinitionIdParamDto {
  @IsEntityId()
  id!: string;
}

@ApiTags('query-definitions')
@ApiFoundationAuthHeaders()
@UseGuards(AdminKeyGuard, AdminRolesGuard)
@Controller('api/v1/query-definitions')
export class QueryDefinitionsController {
  constructor(private readonly queryDefinitionsService: QueryDefinitionsService) {}

  @Post()
  @ApiOperation({
    summary: 'Create a semantic query definition.',
    description:
      'Protected by temporary foundation admin-key auth. It stores declarative semantic metadata only and never executes queries.',
  })
  @AdminRoles(AdminRole.Owner, AdminRole.Admin, AdminRole.Operator)
  @ApiCreatedResponse({ type: QueryDefinitionResponseDto })
  create(
    @Body() dto: CreateQueryDefinitionDto,
    @Req() request: AuthenticatedRequest,
  ): Promise<QueryDefinitionResponseDto> {
    return this.queryDefinitionsService.create(dto, this.toActorContext(request));
  }

  @Get()
  @ApiOperation({
    summary: 'List semantic query definitions.',
    description:
      'Protected by temporary foundation admin-key auth. tenantId remains explicit until final authorization exists.',
  })
  @ApiOkResponse({ type: QueryDefinitionListResponseDto })
  findByFilters(
    @Query() query: ListQueryDefinitionsQueryDto,
  ): Promise<QueryDefinitionListResponseDto> {
    return this.queryDefinitionsService.findByFilters(query);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get one semantic query definition.',
    description:
      'Protected by temporary foundation admin-key auth. Lookup is tenant scoped and never executes a data query.',
  })
  @ApiParam({ name: 'id' })
  @ApiOkResponse({ type: QueryDefinitionResponseDto })
  findOne(
    @Param() params: QueryDefinitionIdParamDto,
    @Query() query: QueryDefinitionTenantQueryDto,
  ): Promise<QueryDefinitionResponseDto> {
    return this.queryDefinitionsService.findOne(query.tenantId, params.id);
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Update a semantic query definition.',
    description:
      'Protected by temporary foundation admin-key auth. It updates configuration only and never executes queries.',
  })
  @AdminRoles(AdminRole.Owner, AdminRole.Admin, AdminRole.Operator)
  @ApiParam({ name: 'id' })
  @ApiOkResponse({ type: QueryDefinitionResponseDto })
  update(
    @Param() params: QueryDefinitionIdParamDto,
    @Query() query: QueryDefinitionTenantQueryDto,
    @Body() dto: UpdateQueryDefinitionDto,
    @Req() request: AuthenticatedRequest,
  ): Promise<QueryDefinitionResponseDto> {
    return this.queryDefinitionsService.update(
      query.tenantId,
      params.id,
      dto,
      this.toActorContext(request),
    );
  }

  @Delete(':id')
  @ApiOperation({
    summary: 'Archive a semantic query definition.',
    description:
      'Protected by temporary foundation admin-key auth. This is a soft delete via archived status.',
  })
  @AdminRoles(AdminRole.Owner, AdminRole.Admin, AdminRole.Operator)
  @ApiParam({ name: 'id' })
  @ApiOkResponse({ type: QueryDefinitionResponseDto })
  archive(
    @Param() params: QueryDefinitionIdParamDto,
    @Query() query: QueryDefinitionTenantQueryDto,
    @Req() request: AuthenticatedRequest,
  ): Promise<QueryDefinitionResponseDto> {
    return this.queryDefinitionsService.archive(
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
