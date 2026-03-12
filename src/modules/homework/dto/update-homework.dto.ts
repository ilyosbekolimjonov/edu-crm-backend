import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class UpdateHomeworkDto {
    @ApiPropertyOptional({ example: 'Yangilangan topshiriq matni' })
    @IsOptional()
    @IsString()
    @IsNotEmpty()
    task?: string;

    @ApiPropertyOptional({ example: 'https://cdn.example.com/new-task.pdf' })
    @IsOptional()
    @IsString()
    @IsNotEmpty()
    file?: string;
}
