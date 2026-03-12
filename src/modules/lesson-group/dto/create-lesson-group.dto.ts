import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsNotEmpty, IsString, Min } from 'class-validator';

export class CreateLessonGroupDto {
    @ApiProperty({ example: '1-bo\'lim: Kirish' })
    @IsString()
    @IsNotEmpty()
    name: string;

    @ApiProperty({ example: 1, description: 'Kurs ID' })
    @IsInt()
    @Min(1)
    @Type(() => Number)
    courseId: number;
}
