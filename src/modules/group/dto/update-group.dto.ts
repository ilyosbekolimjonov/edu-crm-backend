import { ApiPropertyOptional } from '@nestjs/swagger';
import { GroupStatus, WeekDays } from '@prisma/client';
import { Type } from 'class-transformer';
import { IsArray, IsDateString, IsEnum, IsInt, IsOptional, IsString, Min } from 'class-validator';

export class UpdateGroupDto {
    @ApiPropertyOptional({ example: 'G2026B' })
    @IsOptional()
    @IsString()
    name?: string;

    @ApiPropertyOptional({ example: 2 })
    @IsOptional()
    @IsInt()
    @Min(1)
    @Type(() => Number)
    mentorId?: number;

    @ApiPropertyOptional({
        type: [Number],
        description: 'Guruhga biriktiriladigan mentor userId ro\'yxati',
    })
    @IsOptional()
    @IsArray()
    @Type(() => Number)
    @IsInt({ each: true })
    @Min(1, { each: true })
    mentorIds?: number[];

    @ApiPropertyOptional({ example: 3 })
    @IsOptional()
    @IsInt()
    @Min(1)
    @Type(() => Number)
    courseId?: number;

    @ApiPropertyOptional({ example: 2 })
    @IsOptional()
    @IsInt()
    @Min(1)
    @Type(() => Number)
    roomId?: number;

    @ApiPropertyOptional({ example: '2026-04-01' })
    @IsOptional()
    @IsDateString()
    startDate?: string;

    @ApiPropertyOptional({ example: '10:00' })
    @IsOptional()
    @IsString()
    startTime?: string;

    @ApiPropertyOptional({ example: 90 })
    @IsOptional()
    @IsInt()
    @Min(30)
    @Type(() => Number)
    durationMinutes?: number;

    @ApiPropertyOptional({ enum: WeekDays, isArray: true })
    @IsOptional()
    @IsArray()
    @IsEnum(WeekDays, { each: true })
    weekDays?: WeekDays[];

    @ApiPropertyOptional({ enum: GroupStatus })
    @IsOptional()
    @IsEnum(GroupStatus)
    status?: GroupStatus;

    @ApiPropertyOptional({
        type: [Number],
        description: 'Guruhdagi student userId ro\'yxatini editor orqali sinxronlash uchun',
    })
    @IsOptional()
    @IsArray()
    @Type(() => Number)
    @IsInt({ each: true })
    @Min(1, { each: true })
    studentIds?: number[];
}
