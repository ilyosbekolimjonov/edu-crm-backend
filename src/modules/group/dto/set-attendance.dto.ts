import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsBoolean, IsDateString, IsInt, Min } from 'class-validator';

export class SetAttendanceDto {
    @ApiProperty({ example: 12, description: 'Talaba userId' })
    @IsInt()
    @Min(1)
    @Type(() => Number)
    userId: number;

    @ApiProperty({ example: '2026-03-17', description: 'Davomat kuni (YYYY-MM-DD)' })
    @IsDateString()
    date: string;

    @ApiProperty({ example: true, description: 'true = bor, false = yo\'q' })
    @IsBoolean()
    present: boolean;
}
