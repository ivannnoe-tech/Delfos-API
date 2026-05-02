import {
  Body,
  Controller,
  Get,
  HttpCode,
  Param,
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
import { CreateExecutionRequestDto } from '../dto/create-execution-request.dto';
import { CreateExecutionRequestEventDto } from '../dto/create-execution-request-event.dto';
import { ExecutionRequestDryRunResponseDto } from '../dto/execution-request-dry-run-response.dto';
import { ListExecutionRequestEventsQueryDto } from '../dto/execution-request-event-query.dto';
import {
  ExecutionRequestEventListResponseDto,
  ExecutionRequestEventResponseDto,
} from '../dto/execution-request-event-response.dto';
import {
  ExecutionRequestTenantQueryDto,
  ListExecutionRequestsQueryDto,
} from '../dto/execution-request-query.dto';
import {
  ExecutionRequestListResponseDto,
  ExecutionRequestResponseDto,
} from '../dto/execution-request-response.dto';
import { ExecutionRequestsService } from '../services/execution-requests.service';

class ExecutionRequestIdParamDto {
  @IsMongoId()
  id!: string;
}

@ApiTags('runtime')
@ApiFoundationAuthHeaders()
@UseGuards(AdminKeyGuard, AdminRolesGuard)
@Controller('api/v1/runtime/execution-requests')
export class ExecutionRequestsController {
  constructor(private readonly executionRequestsService: ExecutionRequestsService) {}

  @Post()
  @ApiOperation({
    summary: 'Register a runtime execution request foundation record.',
    description:
      'Protected by temporary foundation admin-key auth. This endpoint only stores a safe administrative request for future runtime execution and never executes queries, connectors, workers, queues, schedulers, exports or external data access.',
  })
  @AdminRoles(AdminRole.Owner, AdminRole.Admin, AdminRole.Operator)
  @ApiCreatedResponse({ type: ExecutionRequestResponseDto })
  create(
    @Body() dto: CreateExecutionRequestDto,
    @Req() request: AuthenticatedRequest,
  ): Promise<ExecutionRequestResponseDto> {
    return this.executionRequestsService.create(dto, this.toActorContext(request));
  }

  @Get()
  @ApiOperation({
    summary: 'List runtime execution request foundation records.',
    description:
      'Protected by temporary foundation admin-key auth. tenantId remains explicit until final authorization exists. Listing does not inspect or execute target definitions.',
  })
  @ApiOkResponse({ type: ExecutionRequestListResponseDto })
  findByFilters(
    @Query() query: ListExecutionRequestsQueryDto,
  ): Promise<ExecutionRequestListResponseDto> {
    return this.executionRequestsService.findByFilters(query);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get one runtime execution request foundation record.',
    description:
      'Protected by temporary foundation admin-key auth. Lookup is tenant scoped and never starts runtime execution.',
  })
  @ApiParam({ name: 'id' })
  @ApiOkResponse({ type: ExecutionRequestResponseDto })
  findOne(
    @Param() params: ExecutionRequestIdParamDto,
    @Query() query: ExecutionRequestTenantQueryDto,
  ): Promise<ExecutionRequestResponseDto> {
    return this.executionRequestsService.findOne(query.tenantId, params.id);
  }

  @Get(':id/events')
  @ApiOperation({
    summary: 'List safe lifecycle events for one runtime execution request.',
    description:
      'Protected by temporary foundation admin-key auth. Lookup is tenant scoped and only returns safe administrative lifecycle metadata; it never starts runtime execution.',
  })
  @ApiParam({ name: 'id' })
  @ApiOkResponse({ type: ExecutionRequestEventListResponseDto })
  findEvents(
    @Param() params: ExecutionRequestIdParamDto,
    @Query() query: ListExecutionRequestEventsQueryDto,
  ): Promise<ExecutionRequestEventListResponseDto> {
    return this.executionRequestsService.findEvents(params.id, query);
  }

  @Post(':id/events')
  @ApiOperation({
    summary: 'Register a safe lifecycle event or status transition.',
    description:
      'Protected by temporary foundation admin-key auth. This endpoint only records lifecycle metadata and may update the execution request status; it never executes queries, connectors, workers, queues, schedulers, exports or external data access.',
  })
  @AdminRoles(AdminRole.Owner, AdminRole.Admin, AdminRole.Operator)
  @ApiParam({ name: 'id' })
  @ApiCreatedResponse({ type: ExecutionRequestEventResponseDto })
  createEvent(
    @Param() params: ExecutionRequestIdParamDto,
    @Body() dto: CreateExecutionRequestEventDto,
    @Req() request: AuthenticatedRequest,
  ): Promise<ExecutionRequestEventResponseDto> {
    return this.executionRequestsService.createEvent(params.id, dto, this.toActorContext(request));
  }

  @Post(':id/dry-run')
  @ApiOperation({
    summary: 'Check declarative readiness for one runtime execution request.',
    description:
      'Protected by temporary foundation admin-key auth. This endpoint inspects only existing declarative contracts, records a safe lifecycle event, and never executes queries, connectors, workers, queues, schedulers, exports, credential decryption or external data access.',
  })
  @AdminRoles(AdminRole.Owner, AdminRole.Admin, AdminRole.Operator)
  @ApiParam({ name: 'id' })
  @ApiOkResponse({ type: ExecutionRequestDryRunResponseDto })
  @HttpCode(200)
  dryRun(
    @Param() params: ExecutionRequestIdParamDto,
    @Query() query: ExecutionRequestTenantQueryDto,
    @Req() request: AuthenticatedRequest,
  ): Promise<ExecutionRequestDryRunResponseDto> {
    return this.executionRequestsService.dryRun(params.id, query, this.toActorContext(request));
  }

  private toActorContext(request: AuthenticatedRequest): {
    actorId?: string;
    actorRole?: AdminRole;
  } {
    return {
      actorId: request.delfosAuthContext?.actorId,
      actorRole: request.delfosAuthContext?.actorRole,
    };
  }
}
