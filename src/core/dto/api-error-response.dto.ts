import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ApiErrorDetailDto {
  @ApiPropertyOptional({ example: 'tenantId' })
  field?: string;

  @ApiProperty({ example: 'tenantId must be a MongoDB ObjectId' })
  message!: string;
}

export class ApiErrorResponseDto {
  @ApiProperty({ example: 400 })
  statusCode!: number;

  @ApiProperty({ example: 'Bad Request' })
  error!: string;

  @ApiProperty({ example: 'Validation failed' })
  message!: string;

  @ApiPropertyOptional({ type: [ApiErrorDetailDto] })
  details?: ApiErrorDetailDto[];

  @ApiProperty({ example: 'req_123' })
  requestId!: string;

  @ApiProperty({ example: 'req_123' })
  correlationId!: string;

  @ApiProperty({ example: '2026-04-26T00:00:00.000Z' })
  timestamp!: string;

  @ApiProperty({ example: '/api/v1/users' })
  path!: string;

  @ApiProperty({ example: 'POST' })
  method!: string;
}
