import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional } from 'class-validator';

import { PaginationQueryDto } from '../../../core/dto/pagination-query.dto';
import { IsEntityId } from '../../../core/validation/is-entity-id.decorator';

export class ListCredentialsQueryDto extends PaginationQueryDto {
  @ApiProperty({ example: '662d4f6e7a1c2b00124f0001' })
  @IsEntityId()
  tenantId!: string;

  @ApiPropertyOptional({ example: '662d4f6e7a1c2b00124f0201' })
  @IsOptional()
  @IsEntityId()
  connectionId?: string;
}

export class CredentialTenantQueryDto {
  @ApiProperty({ example: '662d4f6e7a1c2b00124f0001' })
  @IsEntityId()
  tenantId!: string;
}
