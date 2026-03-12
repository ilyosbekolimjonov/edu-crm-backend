import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateHomeworkDto {
    @ApiProperty({ example: 'NestJS yordamida CRUD API yarating va GitHub\'ga yuklang' })
    @IsString()
    @IsNotEmpty()
    task: string;

    @ApiPropertyOptional({ example: 'https://cdn.example.com/task.pdf', description: 'Topshiriq fayl URL' })
    @IsOptional()
    @IsString()
    @IsNotEmpty()
    file?: string;

    @ApiProperty({ example: '3f7a1b2c-...' , description: 'Lesson ID (UUID)' })
    @IsString()
    @IsNotEmpty()
    lessonId: string;
}
