import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, Min } from 'class-validator';

export class AddStudentDto {
    @ApiProperty({ example: 5, description: 'Student (User) ID' })
    @IsInt()
    @Min(1)
    @Type(() => Number)
    userId: number;
}
