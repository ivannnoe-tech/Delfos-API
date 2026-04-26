import { ApiProperty } from '@nestjs/swagger';
import { IsMongoId } from 'class-validator';

import { PaginationQueryDto } from '../../../core/dto/pagination-query.dto';

export class ListConnectionsQueryDto extends PaginationQueryDto {
  @ApiProperty({ example: '662d4f6e7a1c2b00124f0001' })
  @IsMongoId()
  tenantId!: string;
}

export class ConnectionTenantQueryDto {
  @ApiProperty({ example: '662d4f6e7a1c2b00124f0001' })
  @IsMongoId()
  tenantId!: string;
}
