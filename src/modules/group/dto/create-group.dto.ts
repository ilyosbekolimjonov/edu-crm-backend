import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { WeekDays } from '@prisma/client';
import { Type } from 'class-transformer';
import { IsArray, IsDateString, IsEnum, IsInt, IsNotEmpty, IsOptional, IsString, Min } from 'class-validator';

export class CreateGroupDto {
    @ApiProperty({ example: 'G2026A' })
    @IsString()
    @IsNotEmpty()
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

    @ApiProperty({ example: 1, description: 'Xona ID' })
    @IsInt()
    @Min(1)
    @Type(() => Number)
    roomId: number;

    @ApiProperty({ example: '2026-03-15' })
    @IsDateString()
    startDate: string;

    @ApiProperty({ example: '09:00', description: 'Boshlanish vaqti (HH:mm)' })
    @IsString()
    @IsNotEmpty()
    startTime: string;

    @ApiPropertyOptional({ example: 90, description: 'Dars davomiyligi (daqiqada)', default: 90 })
    @IsOptional()
    @IsInt()
    @Min(30)
    @Type(() => Number)
    durationMinutes?: number;

    @ApiProperty({ enum: WeekDays, isArray: true, example: [WeekDays.MONDAY, WeekDays.WEDNESDAY, WeekDays.FRIDAY] })
    @IsArray()
    @IsEnum(WeekDays, { each: true })
    weekDays: WeekDays[];
}
