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
import { CreateReportDefinitionDto } from '../dto/create-report-definition.dto';
import {
  ListReportDefinitionsQueryDto,
  ReportDefinitionTenantQueryDto,
} from '../dto/report-definition-query.dto';
import {
  ReportDefinitionListResponseDto,
  ReportDefinitionResponseDto,
} from '../dto/report-definition-response.dto';
import { UpdateReportDefinitionDto } from '../dto/update-report-definition.dto';
import { ReportDefinitionsService } from '../services/report-definitions.service';

class ReportDefinitionIdParamDto {
  @IsEntityId()
  id!: string;
}

@ApiTags('report-definitions')
@ApiFoundationAuthHeaders()
@UseGuards(AdminKeyGuard, AdminRolesGuard)
@Controller('api/v1/report-definitions')
export class ReportDefinitionsController {
  constructor(private readonly reportDefinitionsService: ReportDefinitionsService) {}

  @Post()
  @ApiOperation({
    summary: 'Create a report definition.',
    description:
      'Protected by temporary foundation admin-key auth. It stores declarative report configuration only and never generates files, sends email, schedules jobs or executes queries.',
  })
  @AdminRoles(AdminRole.Owner, AdminRole.Admin, AdminRole.Operator)
  @ApiCreatedResponse({ type: ReportDefinitionResponseDto })
  create(
    @Body() dto: CreateReportDefinitionDto,
    @Req() request: AuthenticatedRequest,
  ): Promise<ReportDefinitionResponseDto> {
    return this.reportDefinitionsService.create(dto, this.toActorContext(request));
  }

  @Get()
  @ApiOperation({
    summary: 'List report definitions.',
    description:
      'Protected by temporary foundation admin-key auth. tenantId remains explicit until final authorization exists.',
  })
  @ApiOkResponse({ type: ReportDefinitionListResponseDto })
  findByFilters(
    @Query() query: ListReportDefinitionsQueryDto,
  ): Promise<ReportDefinitionListResponseDto> {
    return this.reportDefinitionsService.findByFilters(query);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get one report definition.',
    description:
      'Protected by temporary foundation admin-key auth. Lookup is tenant scoped and never executes a report.',
  })
  @ApiParam({ name: 'id' })
  @ApiOkResponse({ type: ReportDefinitionResponseDto })
  findOne(
    @Param() params: ReportDefinitionIdParamDto,
    @Query() query: ReportDefinitionTenantQueryDto,
  ): Promise<ReportDefinitionResponseDto> {
    return this.reportDefinitionsService.findOne(query.tenantId, params.id);
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Update a report definition.',
    description:
      'Protected by temporary foundation admin-key auth. It updates declarative configuration only and never executes queries or exports files.',
  })
  @AdminRoles(AdminRole.Owner, AdminRole.Admin, AdminRole.Operator)
  @ApiParam({ name: 'id' })
  @ApiOkResponse({ type: ReportDefinitionResponseDto })
  update(
    @Param() params: ReportDefinitionIdParamDto,
    @Query() query: ReportDefinitionTenantQueryDto,
    @Body() dto: UpdateReportDefinitionDto,
    @Req() request: AuthenticatedRequest,
  ): Promise<ReportDefinitionResponseDto> {
    return this.reportDefinitionsService.update(
      query.tenantId,
      params.id,
      dto,
      this.toActorContext(request),
    );
  }

  @Delete(':id')
  @ApiOperation({
    summary: 'Archive a report definition.',
    description:
      'Protected by temporary foundation admin-key auth. This is a soft delete via archived status.',
  })
  @AdminRoles(AdminRole.Owner, AdminRole.Admin, AdminRole.Operator)
  @ApiParam({ name: 'id' })
  @ApiOkResponse({ type: ReportDefinitionResponseDto })
  archive(
    @Param() params: ReportDefinitionIdParamDto,
    @Query() query: ReportDefinitionTenantQueryDto,
    @Req() request: AuthenticatedRequest,
  ): Promise<ReportDefinitionResponseDto> {
    return this.reportDefinitionsService.archive(
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
