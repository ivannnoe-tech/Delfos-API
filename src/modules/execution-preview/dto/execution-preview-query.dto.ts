import { ApiProperty } from '@nestjs/swagger';
import { IsMongoId } from 'class-validator';

export class ExecutionPreviewTenantQueryDto {
  @ApiProperty({ example: '662d4f6e7a1c2b00124f0001' })
  @IsMongoId()
  tenantId!: string;
}
