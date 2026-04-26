import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsEnum,
  IsObject,
  IsOptional,
  IsString,
  IsUrl,
  Matches,
  MaxLength,
} from 'class-validator';

import {
  ConnectionAuthType,
  ConnectionStatus,
  ConnectionType,
} from '../schemas/connection.schema';

export class UpdateConnectionDto {
  @ApiPropertyOptional({ example: 'Primary customer API' })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  name?: string;

  @ApiPropertyOptional({ enum: ConnectionType })
  @IsOptional()
  @IsEnum(ConnectionType)
  type?: ConnectionType;

  @ApiPropertyOptional({ example: 'https://api.customer.example' })
  @IsOptional()
  @IsUrl({ protocols: ['http', 'https'], require_protocol: true })
  @MaxLength(2048)
  baseUrl?: string;

  @ApiPropertyOptional({ enum: ConnectionAuthType })
  @IsOptional()
  @IsEnum(ConnectionAuthType)
  authType?: ConnectionAuthType;

  @ApiPropertyOptional({
    example: 'vault-reference-created-outside-this-foundation',
    description: 'Reference to future encrypted credential storage. Never send a raw secret here.',
  })
  @IsOptional()
  @IsString()
  @MaxLength(160)
  credentialRef?: string;

  @ApiPropertyOptional({ example: ['x-client-id'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @MaxLength(80, { each: true })
  @Matches(/^[a-z0-9-]+$/i, { each: true })
  allowedHeaders?: string[];

  @ApiPropertyOptional({
    example: { environment: 'sandbox' },
    description: 'Sanitized non-sensitive connection metadata only.',
  })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, unknown>;

  @ApiPropertyOptional({ enum: ConnectionStatus })
  @IsOptional()
  @IsEnum(ConnectionStatus)
  status?: ConnectionStatus;
}
