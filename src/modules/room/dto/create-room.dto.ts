import { ApiProperty } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import { IsInt, IsNotEmpty, IsString, Min, MinLength } from 'class-validator';
import { trimString } from '../../../common/validation/helpers';

export class CreateRoomDto {
  @ApiProperty({ example: '101-xona' })
  @Transform(({ value }) => trimString(value))
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  name: string;

  @ApiProperty({ example: 25, description: "O'rinlar soni" })
  @IsInt()
  @Min(1)
  @Type(() => Number)
  capacity: number;
}
