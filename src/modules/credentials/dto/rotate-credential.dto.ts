import { ApiProperty } from '@nestjs/swagger';
import { IsString, Matches, MaxLength } from 'class-validator';

export class RotateCredentialDto {
  @ApiProperty({
    example: 'not-a-real-rotated-secret-value',
    description:
      'New sensitive value used only to replace the protected local representation. It is never returned.',
  })
  @IsString()
  @MaxLength(8192)
  @Matches(/\S/, { message: 'secretValue must not be blank' })
  secretValue!: string;
}
