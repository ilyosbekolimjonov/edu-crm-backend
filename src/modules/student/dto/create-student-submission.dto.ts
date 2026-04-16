import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsNotEmpty, IsString, MaxLength, MinLength } from 'class-validator';
import { trimString } from '../../../common/validation/helpers';

export class CreateStudentSubmissionDto {
  @ApiProperty({ example: 'Topshiriq izohi va linklar' })
  @Transform(({ value }) => trimString(value))
  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  @MaxLength(1000)
  text: string;
}
