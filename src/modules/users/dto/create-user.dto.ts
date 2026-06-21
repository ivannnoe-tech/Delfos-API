import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';

import { IsEntityId } from '../../../core/validation/is-entity-id.decorator';
import { UserRole, UserStatus } from '../schemas/user.schema';

export class CreateUserDto {
  @ApiProperty({ example: '662d4f6e7a1c2b00124f0001' })
  @IsEntityId()
  tenantId!: string;

  @ApiProperty({ example: 'Delfos Operator' })
  @IsString()
  @MaxLength(120)
  name!: string;

  @ApiProperty({ example: 'operator@example.com' })
  @IsEmail()
  @MaxLength(160)
  email!: string;

  @ApiPropertyOptional({ enum: UserRole, default: UserRole.Viewer })
  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;

  @ApiPropertyOptional({ enum: UserStatus, default: UserStatus.Invited })
  @IsOptional()
  @IsEnum(UserStatus)
  status?: UserStatus;
}
