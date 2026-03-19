import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { WeekDays } from '@prisma/client';
import { Transform, Type } from 'class-transformer';
import {
  ArrayNotEmpty,
  ArrayUnique,
  IsArray,
  IsDateString,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  Min,
  MinLength,
} from 'class-validator';
import { TIME_REGEX, trimString } from '../../../common/validation/helpers';

export class CreateGroupDto {
  @ApiProperty({ example: 'G2026A' })
  @Transform(({ value }) => trimString(value))
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  name: string;

  @ApiProperty({ example: 1, description: 'Kurs ID' })
  @IsInt()
  @Min(1)
  @Type(() => Number)
  courseId: number;

  @ApiProperty({ example: 2, description: 'Mentor (User) ID' })
  @IsInt()
  @Min(1)
  @Type(() => Number)
  mentorId: number;

  @ApiPropertyOptional({
    type: [Number],
    description:
      "Guruhga biriktiriladigan mentor userId ro'yxati (mentorId ham shu ro'yxatga qo'shiladi)",
    example: [2, 5],
  })
  @IsOptional()
  @IsArray()
  @ArrayUnique()
  @Type(() => Number)
  @IsInt({ each: true })
  @Min(1, { each: true })
  mentorIds?: number[];

  @ApiProperty({ example: 1, description: 'Xona ID' })
  @IsInt()
  @Min(1)
  @Type(() => Number)
  roomId: number;

  @ApiProperty({ example: '2026-03-15' })
  @IsDateString()
  startDate: string;

  @ApiProperty({ example: '09:00', description: 'Boshlanish vaqti (HH:mm)' })
  @Transform(({ value }) => trimString(value))
  @IsString()
  @IsNotEmpty()
  @Matches(TIME_REGEX, { message: "Vaqt HH:mm formatida bo'lishi kerak" })
  startTime: string;

  @ApiPropertyOptional({
    example: 90,
    description: 'Dars davomiyligi (daqiqada)',
    default: 90,
  })
  @IsOptional()
  @IsInt()
  @Min(30)
  @Type(() => Number)
  durationMinutes?: number;

  @ApiProperty({
    enum: WeekDays,
    isArray: true,
    example: [WeekDays.MONDAY, WeekDays.WEDNESDAY, WeekDays.FRIDAY],
  })
  @IsArray()
  @ArrayNotEmpty()
  @ArrayUnique()
  @IsEnum(WeekDays, { each: true })
  weekDays: WeekDays[];

  @ApiPropertyOptional({
    type: [Number],
    description: "Guruhga biriktiriladigan talabalar userId ro'yxati",
    example: [11, 23],
  })
  @IsOptional()
  @IsArray()
  @ArrayUnique()
  @Type(() => Number)
  @IsInt({ each: true })
  @Min(1, { each: true })
  studentIds?: number[];
}
