import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiCreatedResponse, ApiOkResponse, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { IsMongoId } from 'class-validator';

import {
  ConnectionListResponseDto,
  ConnectionResponseDto,
} from '../dto/connection-response.dto';
import { ConnectionTenantQueryDto, ListConnectionsQueryDto } from '../dto/connection-query.dto';
import { CreateConnectionDto } from '../dto/create-connection.dto';
import { UpdateConnectionDto } from '../dto/update-connection.dto';
import { ConnectionsService } from '../services/connections.service';

class ConnectionIdParamDto {
  @IsMongoId()
  id!: string;
}

@ApiTags('connections')
@Controller('api/v1/connections')
export class ConnectionsController {
  constructor(private readonly connectionsService: ConnectionsService) {}

  @Post()
  @ApiOperation({
    summary: 'Create a customer API connection configuration.',
    description:
      'Temporary administrative foundation endpoint. It stores metadata and credential references only; real encryption/authz must be added before production.',
  })
  @ApiCreatedResponse({ type: ConnectionResponseDto })
  create(@Body() dto: CreateConnectionDto): Promise<ConnectionResponseDto> {
    return this.connectionsService.create(dto);
  }

  @Get()
  @ApiOperation({
    summary: 'List connection configurations by tenant.',
    description:
      'Temporary administrative foundation endpoint. No external API call is performed.',
  })
  @ApiOkResponse({ type: ConnectionListResponseDto })
  findByTenant(@Query() query: ListConnectionsQueryDto): Promise<ConnectionListResponseDto> {
    return this.connectionsService.findByTenant(query.tenantId, query.page, query.pageSize);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get one connection configuration.',
    description:
      'Temporary administrative foundation endpoint. No external API call is performed.',
  })
  @ApiParam({ name: 'id' })
  @ApiOkResponse({ type: ConnectionResponseDto })
  findOne(
    @Param() params: ConnectionIdParamDto,
    @Query() query: ConnectionTenantQueryDto,
  ): Promise<ConnectionResponseDto> {
    return this.connectionsService.findOne(query.tenantId, params.id);
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Update a connection configuration.',
    description:
      'Temporary administrative foundation endpoint. Raw secrets must not be sent or stored here.',
  })
  @ApiParam({ name: 'id' })
  @ApiOkResponse({ type: ConnectionResponseDto })
  update(
    @Param() params: ConnectionIdParamDto,
    @Query() query: ConnectionTenantQueryDto,
    @Body() dto: UpdateConnectionDto,
  ): Promise<ConnectionResponseDto> {
    return this.connectionsService.update(query.tenantId, params.id, dto);
  }
}
