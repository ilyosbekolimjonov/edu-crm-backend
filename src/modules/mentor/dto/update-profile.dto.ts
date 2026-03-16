import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, Min } from 'class-validator';

export class UpdateProfileDto {
    @ApiPropertyOptional({ example: 'Frontend va React bo\'yicha mentor' })
    @IsOptional()
    @IsString()
    about?: string;

    @ApiPropertyOptional({ example: 4, description: 'Tajriba (yil)' })
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(0)
    experience?: number;

    @ApiPropertyOptional({ example: 'https://t.me/username' })
    @IsOptional()
    @IsString()
    telegram?: string;

    @ApiPropertyOptional({ example: 'https://linkedin.com/in/username' })
    @IsOptional()
    @IsString()
    linkedin?: string;
}
