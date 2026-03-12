import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class CreateCourseCategoryDto {
    @ApiProperty({ example: 'Backend', description: 'Kategoriya nomi' })
    @IsString()
    @IsNotEmpty()
    name: string;
}
