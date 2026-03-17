import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsNotEmpty, IsOptional, IsString, Min } from 'class-validator';

export class CreateLessonDto {
    @ApiProperty({ example: '1-dars: O\'zgaruvchilar' })
    @IsString()
    @IsNotEmpty()
    name: string;

    @ApiPropertyOptional({ example: 'Bu darsda o\'zgaruvchilar haqida gaplashamiz' })
    @IsOptional()
    @IsString()
    about?: string;

    @ApiPropertyOptional({ example: 'https://youtube.com/watch?v=xyz', description: 'Video URL' })
    @IsOptional()
    @IsString()
    video?: string;

    @ApiProperty({ example: 1, description: 'Group ID' })
    @IsInt()
    @Min(1)
    @Type(() => Number)
    groupId: number;
}
