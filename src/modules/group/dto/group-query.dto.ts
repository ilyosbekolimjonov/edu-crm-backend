import { ApiPropertyOptional } from '@nestjs/swagger';
import { GroupStatus } from '@prisma/client';
import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, Min } from 'class-validator';

export class GroupQueryDto {
    @ApiPropertyOptional({ enum: GroupStatus })
    @IsOptional()
    @IsEnum(GroupStatus)
    status?: GroupStatus;

    @ApiPropertyOptional({ description: 'Kurs ID bo\'yicha filter' })
    @IsOptional()
    @IsInt()
    @Min(1)
    @Type(() => Number)
    courseId?: number;

    @ApiPropertyOptional({ description: 'Mentor ID bo\'yicha filter' })
    @IsOptional()
    @IsInt()
    @Min(1)
    @Type(() => Number)
    mentorId?: number;

    @ApiPropertyOptional({ description: 'Xona ID bo\'yicha filter' })
    @IsOptional()
    @IsInt()
    @Min(1)
    @Type(() => Number)
    roomId?: number;
}
