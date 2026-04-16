import { ApiProperty } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  IsInt,
  IsNotEmpty,
  IsString,
  Matches,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';
import {
  FILE_PATH_REGEX,
  trimString,
} from '../../../common/validation/helpers';

export class CreateSubmissionDto {
  @ApiProperty({ example: 1, description: 'Homework ID' })
  @IsInt()
  @Min(1)
  @Type(() => Number)
  homeworkId: number;

  @ApiProperty({
    example: 'https://cdn.example.com/homework.zip',
    description: 'Topshirilgan fayl URL',
  })
  @Transform(({ value }) => trimString(value))
  @IsString()
  @IsNotEmpty()
  @Matches(FILE_PATH_REGEX, { message: "Fayl manzili noto'g'ri formatda" })
  file: string;

  @ApiProperty({ example: 'GitHub: https://github.com/user/project' })
  @Transform(({ value }) => trimString(value))
  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  @MaxLength(1000)
  text: string;
}
