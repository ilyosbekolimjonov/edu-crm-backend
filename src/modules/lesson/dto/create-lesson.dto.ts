import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsNotEmpty, IsOptional, IsString, IsUrl, Min } from 'class-validator';

export class CreateLessonDto {
    @ApiProperty({ example: '1-dars: O\'zgaruvchilar' })
    @IsString()
    @IsNotEmpty()
    name: string;

    @ApiProperty({ example: 'Bu darsda o\'zgaruvchilar haqida gaplashamiz' })
    @IsString()
    @IsNotEmpty()
    about: string;

    @ApiProperty({ example: 'https://youtube.com/watch?v=xyz', description: 'Video URL' })
    @IsString()
    @IsNotEmpty()
    video: string;

    @ApiProperty({ example: 1, description: 'LessonGroup ID' })
    @IsInt()
    @Min(1)
    @Type(() => Number)
    groupId: number;
}
