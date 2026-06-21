import { ApiProperty } from '@nestjs/swagger';

import { PostgresHealthStatus } from '../../../database/postgres/postgres-health.service';

export class BaseHealthDto {
  @ApiProperty({ example: 'ok' })
  status!: 'ok';

  @ApiProperty({ example: '2026-04-26T12:00:00.000Z' })
  timestamp!: string;

  @ApiProperty({ example: 12.34 })
  uptimeSeconds!: number;
}

export class PostgresHealthDto {
  @ApiProperty({ enum: ['up', 'down', 'disabled'], example: 'disabled' })
  status!: PostgresHealthStatus;

  @ApiProperty({ required: false, example: 3, description: 'Round-trip latency in ms when up.' })
  latencyMs?: number;

  @ApiProperty({ required: false, description: 'Failure reason when down (never a secret).' })
  error?: string;
}

export class CacheHealthDto {
  @ApiProperty({ example: false, description: 'Whether a Valkey backend is active.' })
  enabled!: boolean;

  @ApiProperty({ example: 0 })
  hits!: number;

  @ApiProperty({ example: 0 })
  misses!: number;

  @ApiProperty({ example: 0, description: 'Swallowed backend errors (cache stays best-effort).' })
  errors!: number;
}

export class HealthResponseDto extends BaseHealthDto {
  @ApiProperty({ type: PostgresHealthDto })
  postgres!: PostgresHealthDto;

  @ApiProperty({ type: CacheHealthDto })
  cache!: CacheHealthDto;
}
