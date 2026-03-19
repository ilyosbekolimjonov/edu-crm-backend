import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';
import {
  FILE_PATH_REGEX,
  trimString,
} from '../../../common/validation/helpers';

export class UpdateHomeworkDto {
  @ApiPropertyOptional({ example: 'Yangilangan topshiriq matni' })
  @IsOptional()
  @Transform(({ value }) => trimString(value))
  @IsString()
  @IsNotEmpty()
  @MinLength(5)
  @MaxLength(1000)
  task?: string;

  @ApiPropertyOptional({ example: 'https://cdn.example.com/new-task.pdf' })
  @IsOptional()
  @Transform(({ value }) => trimString(value))
  @IsString()
  @IsNotEmpty()
  @Matches(FILE_PATH_REGEX, { message: "Fayl manzili noto'g'ri formatda" })
  file?: string;
}
