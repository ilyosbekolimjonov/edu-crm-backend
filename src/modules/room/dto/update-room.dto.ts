import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  Min,
  MinLength,
} from 'class-validator';
import { trimString } from '../../../common/validation/helpers';

export class UpdateRoomDto {
  @ApiPropertyOptional({ example: '102-xona' })
  @IsOptional()
  @Transform(({ value }) => trimString(value))
  @IsString()
  @MinLength(2)
  name?: string;

  @ApiPropertyOptional({ example: 30 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  capacity?: number;

  @ApiPropertyOptional({ example: false })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
