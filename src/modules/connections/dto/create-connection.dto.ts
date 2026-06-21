import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
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

import { IsEntityId } from '../../../core/validation/is-entity-id.decorator';
import {
  ConnectionAuthType,
  ConnectionStatus,
  ConnectionType,
} from '../schemas/connection.constants';

export class CreateConnectionDto {
  @ApiProperty({ example: '662d4f6e7a1c2b00124f0001' })
  @IsEntityId()
  tenantId!: string;

  @ApiProperty({ example: 'Primary customer API' })
  @IsString()
  @MaxLength(120)
  name!: string;

  @ApiPropertyOptional({ enum: ConnectionType, default: ConnectionType.CustomerApi })
  @IsOptional()
  @IsEnum(ConnectionType)
  type?: ConnectionType;

  @ApiProperty({ example: 'https://api.customer.example' })
  @IsUrl({ protocols: ['http', 'https'], require_protocol: true })
  @MaxLength(2048)
  baseUrl!: string;

  @ApiPropertyOptional({ enum: ConnectionAuthType, default: ConnectionAuthType.None })
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

  @ApiPropertyOptional({ enum: ConnectionStatus, default: ConnectionStatus.Draft })
  @IsOptional()
  @IsEnum(ConnectionStatus)
  status?: ConnectionStatus;
}
