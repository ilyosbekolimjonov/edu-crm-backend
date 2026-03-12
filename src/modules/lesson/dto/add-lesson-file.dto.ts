import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class AddLessonFileDto {
    @ApiProperty({ example: 'https://cdn.example.com/file.pdf', description: 'Fayl URL' })
    @IsString()
    @IsNotEmpty()
    file: string;

    @ApiPropertyOptional({ example: 'Ma\'ruza matni' })
    @IsOptional()
    @IsString()
    note?: string;
}
