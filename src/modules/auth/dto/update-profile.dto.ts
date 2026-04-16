import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsNotEmpty,
  IsOptional,
  IsString,
  Length,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';
import {
  normalizePhone,
  PHONE_REGEX,
  trimString,
  USERNAME_REGEX,
} from '../../../common/validation/helpers';

export class UpdateAdminProfileDto {
  @ApiPropertyOptional({ example: 'Ali Valiyev' })
  @IsOptional()
  @Transform(({ value }) => trimString(value))
  @IsString()
  @IsNotEmpty()
  @Length(3, 100)
  fullName?: string;

  @ApiPropertyOptional({ example: 'ali_valiyev' })
  @IsOptional()
  @Transform(({ value }) => trimString(value))
  @IsString()
  @IsNotEmpty()
  @Length(3, 30)
  @Matches(USERNAME_REGEX, { message: "Username bo'sh joysiz bo'lishi kerak" })
  username?: string;

  @ApiPropertyOptional({ example: '+998901234567' })
  @IsOptional()
  @Transform(({ value }) => normalizePhone(value))
  @IsString()
  @IsNotEmpty()
  @Matches(PHONE_REGEX, {
    message: "Telefon raqam +998XXXXXXXXX formatida bo'lishi kerak",
  })
  phone?: string;

  @ApiPropertyOptional({ example: 'oldStrongPassword123' })
  @IsOptional()
  @Transform(({ value }) => trimString(value))
  @IsString()
  @IsNotEmpty()
  @MinLength(6)
  @MaxLength(128)
  currentPassword?: string;

  @ApiPropertyOptional({ example: 'newStrongPassword123' })
  @IsOptional()
  @Transform(({ value }) => trimString(value))
  @IsString()
  @IsNotEmpty()
  @MinLength(6)
  @MaxLength(128)
  password?: string;
}
