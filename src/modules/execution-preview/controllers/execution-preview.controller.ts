import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiBody, ApiOkResponse, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { IsMongoId } from 'class-validator';

import { ApiFoundationAuthHeaders } from '../../auth/decorators/api-foundation-auth-headers.decorator';
import { AdminKeyGuard } from '../../auth/guards/admin-key.guard';
import { AdminRolesGuard } from '../../auth/guards/admin-roles.guard';
import { AuthenticatedRequest } from '../../auth/types/authenticated-request';
import { DashboardPreviewResultDto } from '../dto/dashboard-preview-response.dto';
import { ExecutionPreviewTenantQueryDto } from '../dto/execution-preview-query.dto';
import {
  DashboardPreviewRequestDto,
  QueryPreviewRequestDto,
} from '../dto/execution-preview-request.dto';
import { QueryPreviewResultDto } from '../dto/query-preview-response.dto';
import { ExecutionPreviewService } from '../services/execution-preview.service';

class ExecutionPreviewIdParamDto {
  @IsMongoId()
  id!: string;
}

@ApiTags('execution-preview')
@ApiFoundationAuthHeaders()
@UseGuards(AdminKeyGuard, AdminRolesGuard)
@Controller('api/v1')
export class ExecutionPreviewController {
  constructor(private readonly executionPreviewService: ExecutionPreviewService) {}

  @Post('query-definitions/:id/preview')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Generate a safe demo preview for a query definition.',
    description:
      'Protected by temporary foundation admin-key auth. This endpoint only generates in-memory demo data, requires tenantId, uses tenant-scoped lookup, and never executes SQL, MongoDB aggregation, external API calls, connectors, cache, workers or schedulers. No actor role is required, following the current read/list foundation pattern.',
  })
  @ApiParam({ name: 'id' })
  @ApiBody({ type: QueryPreviewRequestDto, required: false })
  @ApiOkResponse({ type: QueryPreviewResultDto })
  previewQueryDefinition(
    @Param() params: ExecutionPreviewIdParamDto,
    @Query() query: ExecutionPreviewTenantQueryDto,
    @Body() requestBody: QueryPreviewRequestDto,
    @Req() request: AuthenticatedRequest,
  ): Promise<QueryPreviewResultDto> {
    return this.executionPreviewService.previewQuery(
      query.tenantId,
      params.id,
      requestBody ?? {},
      this.toActorContext(request),
    );
  }

  @Post('dashboard-definitions/:id/preview')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Generate a safe demo preview for a dashboard definition.',
    description:
      'Protected by temporary foundation admin-key auth. This endpoint only generates in-memory demo data, requires tenantId, uses tenant-scoped lookup, degrades widgets with missing queryDefinitionId, and never executes SQL, MongoDB aggregation, external API calls, connectors, cache, workers or schedulers. No actor role is required, following the current read/list foundation pattern.',
  })
  @ApiParam({ name: 'id' })
  @ApiBody({ type: DashboardPreviewRequestDto, required: false })
  @ApiOkResponse({ type: DashboardPreviewResultDto })
  previewDashboardDefinition(
    @Param() params: ExecutionPreviewIdParamDto,
    @Query() query: ExecutionPreviewTenantQueryDto,
    @Body() requestBody: DashboardPreviewRequestDto,
    @Req() request: AuthenticatedRequest,
  ): Promise<DashboardPreviewResultDto> {
    return this.executionPreviewService.previewDashboard(
      query.tenantId,
      params.id,
      requestBody ?? {},
      this.toActorContext(request),
    );
  }

  private toActorContext(request: AuthenticatedRequest): { actorId?: string } {
    return {
      actorId: request.delfosAuthContext?.actorId,
    };
  }
}
