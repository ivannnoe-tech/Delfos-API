import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString, Matches, MaxLength } from 'class-validator';

import { IsEntityId } from '../../../core/validation/is-entity-id.decorator';
import { CredentialType } from '../schemas/credential.constants';

export class CreateCredentialDto {
  @ApiProperty({ example: '662d4f6e7a1c2b00124f0001' })
  @IsEntityId()
  tenantId!: string;

  @ApiPropertyOptional({ example: '662d4f6e7a1c2b00124f0201' })
  @IsOptional()
  @IsEntityId()
  connectionId?: string;

  @ApiProperty({ enum: CredentialType, example: CredentialType.ApiKey })
  @IsEnum(CredentialType)
  type!: CredentialType;

  @ApiPropertyOptional({ example: 'customer-api' })
  @IsOptional()
  @IsString()
  @MaxLength(80)
  @Matches(/^[A-Za-z0-9._:-]+$/)
  provider?: string;

  @ApiProperty({ example: 'Primary customer API credential' })
  @IsString()
  @MaxLength(120)
  name!: string;

  @ApiProperty({
    example: 'not-a-real-secret-value',
    description:
      'Sensitive value used only to create the protected local representation. It is never returned.',
  })
  @IsString()
  @MaxLength(8192)
  @Matches(/\S/, { message: 'secretValue must not be blank' })
  secretValue!: string;
}
