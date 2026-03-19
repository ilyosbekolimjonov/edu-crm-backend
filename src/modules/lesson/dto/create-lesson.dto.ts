import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';
import { trimString } from '../../../common/validation/helpers';

export class CreateLessonDto {
  @ApiProperty({ example: "1-dars: O'zgaruvchilar" })
  @Transform(({ value }) => trimString(value))
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(120)
  name: string;

  @ApiPropertyOptional({
    example: "Bu darsda o'zgaruvchilar haqida gaplashamiz",
  })
  @IsOptional()
  @Transform(({ value }) => trimString(value))
  @IsString()
  @MinLength(5)
  @MaxLength(1000)
  about?: string;

  @ApiPropertyOptional({
    example: 'https://youtube.com/watch?v=xyz',
    description: 'Video URL',
  })
  @IsOptional()
  @Transform(({ value }) => trimString(value))
  @IsString()
  @MaxLength(255)
  video?: string;

  @ApiProperty({ example: 1, description: 'Group ID' })
  @IsInt()
  @Min(1)
  @Type(() => Number)
  groupId: number;
}
