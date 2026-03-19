import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';
import { trimString } from '../../../common/validation/helpers';

export class UpdateLessonDto {
  @ApiPropertyOptional({ example: "1-dars: O'zgaruvchilar (yangilandi)" })
  @IsOptional()
  @Transform(({ value }) => trimString(value))
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(120)
  name?: string;

  @ApiPropertyOptional({ example: 'Yangilangan tavsif' })
  @IsOptional()
  @Transform(({ value }) => trimString(value))
  @IsString()
  @IsNotEmpty()
  @MinLength(5)
  @MaxLength(1000)
  about?: string;

  @ApiPropertyOptional({ example: 'https://youtube.com/watch?v=new' })
  @IsOptional()
  @Transform(({ value }) => trimString(value))
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  video?: string;
}
