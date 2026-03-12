import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsNotEmpty, IsString, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateRoomDto {
    @ApiProperty({ example: '101-xona' })
    @IsString()
    @IsNotEmpty()
    name: string;

    @ApiProperty({ example: 25, description: 'O\'rinlar soni' })
    @IsInt()
    @Min(1)
    @Type(() => Number)
    capacity: number;
}
