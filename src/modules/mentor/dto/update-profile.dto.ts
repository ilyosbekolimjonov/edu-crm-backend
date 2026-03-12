import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional, IsString, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class UpdateProfileDto {
    @ApiPropertyOptional({ example: 'NestJS va TypeScript bo\'yicha 5 yillik tajriba' })
    @IsOptional()
    @IsString()
    about?: string;

    @ApiPropertyOptional({ example: 'Senior Backend Developer' })
    @IsOptional()
    @IsString()
    job?: string;

    @ApiPropertyOptional({ example: 5, description: 'Tajriba (yil)' })
    @IsOptional()
    @IsInt()
    @Min(0)
    @Type(() => Number)
    experience?: number;

    @ApiPropertyOptional({ example: 'https://t.me/username' })
    @IsOptional()
    @IsString()
    telegram?: string;

    @ApiPropertyOptional({ example: 'https://instagram.com/username' })
    @IsOptional()
    @IsString()
    instagram?: string;

    @ApiPropertyOptional({ example: 'https://linkedin.com/in/username' })
    @IsOptional()
    @IsString()
    linkedin?: string;

    @ApiPropertyOptional({ example: 'https://facebook.com/username' })
    @IsOptional()
    @IsString()
    facebook?: string;

    @ApiPropertyOptional({ example: 'https://github.com/username' })
    @IsOptional()
    @IsString()
    github?: string;

    @ApiPropertyOptional({ example: 'https://mywebsite.uz' })
    @IsOptional()
    @IsString()
    website?: string;
}
