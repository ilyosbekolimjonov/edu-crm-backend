import { ApiPropertyOptional } from '@nestjs/swagger';
import { CourseLevel } from '@prisma/client';
import { Type } from 'class-transformer';
import { IsBoolean, IsEnum, IsInt, IsOptional, IsString, Min } from 'class-validator';

export class CourseQueryDto {
    @ApiPropertyOptional({ description: 'Kategoriya ID bo\'yicha filter' })
    @IsOptional()
    @IsInt()
    @Min(1)
    @Type(() => Number)
    categoryId?: number;

    @ApiPropertyOptional({ enum: CourseLevel, description: 'Daraja bo\'yicha filter' })
    @IsOptional()
    @IsEnum(CourseLevel)
    level?: CourseLevel;

    @ApiPropertyOptional({ description: 'Mentor ID bo\'yicha filter' })
    @IsOptional()
    @IsInt()
    @Min(1)
    @Type(() => Number)
    mentorId?: number;

    @ApiPropertyOptional({ description: 'Faqat nashr etilganlar (true/false)', example: 'true' })
    @IsOptional()
    @IsString()
    published?: string;

    @ApiPropertyOptional({ description: 'Nom bo\'yicha qidirish' })
    @IsOptional()
    @IsString()
    search?: string;
}
