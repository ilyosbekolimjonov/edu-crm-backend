import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';
import {
  FILE_PATH_REGEX,
  trimString,
} from '../../../common/validation/helpers';

export class CreateHomeworkDto {
  @ApiProperty({
    example: "NestJS yordamida CRUD API yarating va GitHub'ga yuklang",
  })
  @Transform(({ value }) => trimString(value))
  @IsString()
  @IsNotEmpty()
  @MinLength(5)
  @MaxLength(1000)
  task: string;

  @ApiPropertyOptional({
    example: 'https://cdn.example.com/task.pdf',
    description: 'Topshiriq fayl URL',
  })
  @IsOptional()
  @Transform(({ value }) => trimString(value))
  @IsString()
  @IsNotEmpty()
  @Matches(FILE_PATH_REGEX, { message: "Fayl manzili noto'g'ri formatda" })
  file?: string;

  @ApiProperty({
    example: '3f7a1b2c-0000-0000-0000-000000000000',
    description: 'Lesson ID (UUID)',
  })
  @IsString()
  @IsNotEmpty()
  @IsUUID()
  lessonId: string;
}
