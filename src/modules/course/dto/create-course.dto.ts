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

    @ApiProperty({ example: 1500000, description: 'Narx (so\'m)' })
    @IsNotEmpty()
    price: number;

    @ApiProperty({ example: 'https://cdn.example.com/banner.jpg', description: 'Banner rasmi URL' })
    @IsString()
    @IsNotEmpty()
    banner: string;

    @ApiPropertyOptional({ example: 'https://youtube.com/watch?v=abc', description: 'Kirish video URL' })
    @IsOptional()
    @IsString()
    introVideo?: string;

    @ApiProperty({ enum: CourseLevel, example: CourseLevel.INTERMEDIATE })
    @IsEnum(CourseLevel, { message: 'Noto\'g\'ri kurs darajasi' })
    level: CourseLevel;

    @ApiProperty({ example: 1, description: 'Kategoriya ID' })
    @IsInt()
    @Min(1)
    @Type(() => Number)
    categoryId: number;

    @ApiProperty({ example: 2, description: 'Mentor User ID' })
    @IsInt()
    @Min(1)
    @Type(() => Number)
    mentorId: number;
}
