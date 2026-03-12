import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsNotEmpty, IsOptional, IsString, Min } from 'class-validator';

export class CreateSubmissionDto {
    @ApiProperty({ example: 1, description: 'Homework ID' })
    @IsInt()
    @Min(1)
    @Type(() => Number)
    homeworkId: number;

    @ApiProperty({ example: 'https://cdn.example.com/homework.zip', description: 'Topshirilgan fayl URL' })
    @IsString()
    @IsNotEmpty()
    file: string;

    @ApiPropertyOptional({ example: 'GitHub: https://github.com/user/project' })
    @IsOptional()
    @IsString()
    @IsNotEmpty()
    text?: string;
}
