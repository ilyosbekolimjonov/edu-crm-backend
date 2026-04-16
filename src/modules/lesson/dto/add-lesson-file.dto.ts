import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
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

export class AddLessonFileDto {
  @ApiProperty({
    example: 'https://cdn.example.com/file.pdf',
    description: 'Fayl URL',
  })
  @Transform(({ value }) => trimString(value))
  @IsString()
  @IsNotEmpty()
  @Matches(FILE_PATH_REGEX, { message: "Fayl manzili noto'g'ri formatda" })
  file: string;

  @ApiPropertyOptional({ example: "Ma'ruza matni" })
  @IsOptional()
  @Transform(({ value }) => trimString(value))
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(255)
  note?: string;
}
