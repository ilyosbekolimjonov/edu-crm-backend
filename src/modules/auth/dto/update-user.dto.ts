import { ApiPropertyOptional } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { Transform, Type } from 'class-transformer';
import {
  IsEmail,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Length,
  Matches,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';
import {
  FILE_PATH_REGEX,
  normalizePhone,
  PHONE_REGEX,
  trimString,
  USERNAME_REGEX,
} from '../../../common/validation/helpers';

export class UpdateUserDto {
  @ApiPropertyOptional({ example: 'Ali Valiyev' })
  @IsOptional()
  @Transform(({ value }) => trimString(value))
  @IsString()
  @IsNotEmpty()
  @Length(3, 100, {
    message: "To'liq ism 3 dan 100 tagacha belgidan iborat bo'lishi kerak",
  })
  fullName?: string;

  @ApiPropertyOptional({ example: 'ali_valiyev' })
  @IsOptional()
  @Transform(({ value }) => trimString(value))
  @IsString()
  @IsNotEmpty()
  @Length(3, 30, {
    message: "Username 3 dan 30 tagacha belgidan iborat bo'lishi kerak",
  })
  @Matches(USERNAME_REGEX, {
    message: "Username bo'sh joysiz bo'lishi kerak",
  })
  username?: string;

  @ApiPropertyOptional({ example: 'ali@example.com' })
  @IsOptional()
  @Transform(({ value }) => trimString(value))
  @IsEmail()
  @IsNotEmpty()
  email?: string;

  @ApiPropertyOptional({ example: '+998901234567' })
  @IsOptional()
  @Transform(({ value }) => normalizePhone(value))
  @IsString()
  @IsNotEmpty()
  @Matches(PHONE_REGEX, {
    message: "Telefon raqam +998XXXXXXXXX formatida bo'lishi kerak",
  })
  phone?: string;

  @ApiPropertyOptional({
    example: '/uploads/users/user-123.png',
    description: 'Profil rasmi URL',
  })
  @IsOptional()
  @Transform(({ value }) => trimString(value))
  @IsString()
  @IsNotEmpty()
  @Matches(FILE_PATH_REGEX, { message: "Rasm manzili noto'g'ri formatda" })
  image?: string;

  @ApiPropertyOptional({ example: 'newStrongPassword123' })
  @IsOptional()
  @Transform(({ value }) => trimString(value))
  @IsString()
  @IsNotEmpty()
  @MinLength(6, { message: "Parol kamida 6 belgidan iborat bo'lishi kerak" })
  @MaxLength(128, { message: 'Parol 128 belgidan oshmasligi kerak' })
  password?: string;

  @ApiPropertyOptional({ enum: UserRole })
  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;

  @ApiPropertyOptional({ example: 'Mentor haqida qisqacha ma`lumot' })
  @IsOptional()
  @Transform(({ value }) => trimString(value))
  @IsString()
  @IsNotEmpty()
  @MinLength(5, {
    message: "Mentor haqida matn kamida 5 belgidan iborat bo'lishi kerak",
  })
  @MaxLength(500, {
    message: 'Mentor haqida matn 500 belgidan oshmasligi kerak',
  })
  about?: string;

  @ApiPropertyOptional({ example: 3, description: 'Yillik tajriba' })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Type(() => Number)
  experience?: number;

  @ApiPropertyOptional({ example: 'https://t.me/mentor' })
  @IsOptional()
  @Transform(({ value }) => trimString(value))
  @IsString()
  @IsNotEmpty()
  @MaxLength(255, { message: 'Telegram havolasi juda uzun' })
  telegram?: string;

  @ApiPropertyOptional({ example: 'https://linkedin.com/in/mentor' })
  @IsOptional()
  @Transform(({ value }) => trimString(value))
  @IsString()
  @IsNotEmpty()
  @MaxLength(255, { message: 'LinkedIn havolasi juda uzun' })
  linkedin?: string;
}
