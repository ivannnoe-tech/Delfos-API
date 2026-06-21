import { ApiProperty } from '@nestjs/swagger';

import { PaginationQueryDto } from '../../../core/dto/pagination-query.dto';
import { IsEntityId } from '../../../core/validation/is-entity-id.decorator';

export class ListUsersQueryDto extends PaginationQueryDto {
  @ApiProperty({ example: '662d4f6e7a1c2b00124f0001' })
  @IsEntityId()
  tenantId!: string;
}

export class TenantScopedQueryDto {
  @ApiProperty({ example: '662d4f6e7a1c2b00124f0001' })
  @IsEntityId()
  tenantId!: string;
}
