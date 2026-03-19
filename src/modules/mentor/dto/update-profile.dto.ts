import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';
import { trimString } from '../../../common/validation/helpers';

export class UpdateProfileDto {
  @ApiPropertyOptional({ example: "Frontend va React bo'yicha mentor" })
  @IsOptional()
  @Transform(({ value }) => trimString(value))
  @IsString()
  @MinLength(5)
  @MaxLength(500)
  about?: string;

  @ApiPropertyOptional({ example: 4, description: 'Tajriba (yil)' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  experience?: number;

  @ApiPropertyOptional({ example: 'https://t.me/username' })
  @IsOptional()
  @Transform(({ value }) => trimString(value))
  @IsString()
  @MaxLength(255)
  telegram?: string;

  @ApiPropertyOptional({ example: 'https://linkedin.com/in/username' })
  @IsOptional()
  @Transform(({ value }) => trimString(value))
  @IsString()
  @MaxLength(255)
  linkedin?: string;
}
