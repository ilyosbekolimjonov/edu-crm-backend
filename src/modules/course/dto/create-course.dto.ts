import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CourseLevel } from '@prisma/client';
import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsNotEmpty, IsOptional, IsString, Min, } from 'class-validator';

export class CreateCourseDto {
    @ApiProperty({ example: 'NestJS — Backend Development' })
    @IsString()
    @IsNotEmpty()
    name: string;

    @ApiProperty({ example: 'NestJS framework yordamida backend dasturlashni o\'rganasiz' })
    @IsString()
    @IsNotEmpty()
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

    @ApiProperty({ example: 1500000, description: 'Narx (so\'m)' })
    @IsNotEmpty()
    price: number;

    @ApiPropertyOptional({ example: 'https://youtube.com/watch?v=abc', description: 'Kirish video URL' })
    @IsOptional()
    @IsString()
    introVideo?: string;

    @ApiProperty({ enum: CourseLevel, example: CourseLevel.INTERMEDIATE })
    @IsEnum(CourseLevel, { message: 'Noto\'g\'ri kurs darajasi' })
    level: CourseLevel;

    @ApiProperty({ example: 2, description: 'Mentor User ID' })
    @IsInt()
    @Min(1)
    @Type(() => Number)
    mentorId: number;
}
