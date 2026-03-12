import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class UpdateLessonDto {
    @ApiPropertyOptional({ example: '1-dars: O\'zgaruvchilar (yangilandi)' })
    @IsOptional()
    @IsString()
    @IsNotEmpty()
    name?: string;

    @ApiPropertyOptional({ example: 'Yangilangan tavsif' })
    @IsOptional()
    @IsString()
    @IsNotEmpty()
    about?: string;

    @ApiPropertyOptional({ example: 'https://youtube.com/watch?v=new' })
    @IsOptional()
    @IsString()
    @IsNotEmpty()
    video?: string;
}
