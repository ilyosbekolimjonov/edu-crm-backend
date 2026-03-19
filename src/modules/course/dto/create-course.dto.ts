import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CourseLevel } from '@prisma/client';
import { Transform, Type } from 'class-transformer';
import {
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';
import { trimString } from '../../../common/validation/helpers';

export class CreateCourseDto {
  @ApiProperty({ example: 'NestJS Backend Development' })
  @Transform(({ value }) => trimString(value))
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(120)
  name: string;

  @ApiProperty({
    example: "NestJS framework yordamida backend dasturlashni o'rganasiz",
  })
  @Transform(({ value }) => trimString(value))
  @IsString()
  @IsNotEmpty()
  @MinLength(10)
  @MaxLength(1000)
  about: string;

  @ApiProperty({ example: 60, description: 'Dars davomiyligi (daqiqa)' })
  @IsInt()
  @Min(1)
  @Type(() => Number)
  durationMinutes: number;

  @ApiProperty({ example: 12, description: 'Kurs davomiyligi (oy)' })
  @IsInt()
  @Min(1)
  @Type(() => Number)
  durationMonths: number;

  @ApiProperty({ example: 1500000, description: "Narx (so'm)" })
  @IsNotEmpty()
  @IsNumber({}, { message: "Narx son bo'lishi kerak" })
  @Min(0)
  @Type(() => Number)
  price: number;

  @ApiPropertyOptional({
    example: 'https://youtube.com/watch?v=abc',
    description: 'Kirish video URL',
  })
  @IsOptional()
  @Transform(({ value }) => trimString(value))
  @IsString()
  @MaxLength(255)
  introVideo?: string;

  @ApiProperty({ enum: CourseLevel, example: CourseLevel.INTERMEDIATE })
  @IsEnum(CourseLevel, { message: "Noto'g'ri kurs darajasi" })
  level: CourseLevel;

  @ApiProperty({ example: 2, description: 'Mentor User ID' })
  @IsInt()
  @Min(1)
  @Type(() => Number)
  mentorId: number;
}
