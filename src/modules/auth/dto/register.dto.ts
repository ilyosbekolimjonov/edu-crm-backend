import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { Transform, Type } from 'class-transformer';
import {
  IsEmail,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
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

export class RegisterDto {
  @ApiProperty({ example: 'Ali Valiyev', description: "To'liq ism" })
  @Transform(({ value }) => trimString(value))
  @IsString()
  @IsNotEmpty()
  @MinLength(2, {
    message: "To'liq ism kamida 2 belgidan iborat bo'lishi kerak",
  })
  @MaxLength(80, { message: "To'liq ism 80 belgidan oshmasligi kerak" })
  fullName: string;

  @ApiProperty({ example: 'ali_valiyev', description: 'Foydalanuvchi nomi' })
  @Transform(({ value }) => trimString(value))
  @IsString()
  @IsNotEmpty()
  @Matches(USERNAME_REGEX, {
    message:
      "Username faqat harf, raqam, nuqta va pastki chiziqdan iborat bo'lishi kerak",
  })
  username: string;

  @ApiProperty({ example: 'ali@example.com', description: 'Email manzil' })
  @Transform(({ value }) => trimString(value))
  @IsEmail({}, { message: "To'g'ri email kiriting" })
  @IsNotEmpty()
  email: string;

  @ApiProperty({ example: '+998901234567', description: 'Telefon raqam' })
  @Transform(({ value }) => normalizePhone(value))
  @IsString()
  @IsNotEmpty()
  @Matches(PHONE_REGEX, {
    message: "Telefon nomer faqat raqam va kamida 9 xonali bo'lishi kerak",
  })
  phone: string;

  @ApiPropertyOptional({
    example: '/uploads/users/user-123.png',
    description: 'Profil rasmi URL',
  })
  @IsOptional()
  @Transform(({ value }) => trimString(value))
  @IsString()
  @Matches(FILE_PATH_REGEX, { message: "Rasm manzili noto'g'ri formatda" })
  image?: string;

  @ApiProperty({ example: 'Secret@123', description: 'Parol (kamida 6 belgi)' })
  @Transform(({ value }) => trimString(value))
  @IsString()
  @MinLength(6, { message: "Parol kamida 6 belgidan iborat bo'lishi kerak" })
  @MaxLength(128, { message: 'Parol 128 belgidan oshmasligi kerak' })
  password: string;

  @ApiPropertyOptional({
    enum: [
      UserRole.ADMIN,
      UserRole.MENTOR,
      UserRole.ASSISTANT,
      UserRole.STUDENT,
    ],
    default: UserRole.STUDENT,
  })
  @IsOptional()
  @IsEnum(
    [UserRole.ADMIN, UserRole.MENTOR, UserRole.ASSISTANT, UserRole.STUDENT],
    { message: "Noto'g'ri rol" },
  )
  role?: UserRole;

  @ApiPropertyOptional({
    example: 'https://t.me/username',
    description: 'Mentor telegram havolasi',
  })
  @IsOptional()
  @Transform(({ value }) => trimString(value))
  @IsString()
  @MaxLength(255, { message: 'Telegram havolasi juda uzun' })
  telegram?: string;

  @ApiPropertyOptional({
    example: 'https://linkedin.com/in/username',
    description: 'Mentor linkedin havolasi',
  })
  @IsOptional()
  @Transform(({ value }) => trimString(value))
  @IsString()
  @MaxLength(255, { message: 'LinkedIn havolasi juda uzun' })
  linkedin?: string;

  @ApiPropertyOptional({
    example: "Frontend va React bo'yicha mentor",
    description: "Mentor haqida qisqa ma'lumot",
  })
  @IsOptional()
  @Transform(({ value }) => trimString(value))
  @IsString()
  @MinLength(5, {
    message: "Mentor haqida matn kamida 5 belgidan iborat bo'lishi kerak",
  })
  @MaxLength(500, {
    message: 'Mentor haqida matn 500 belgidan oshmasligi kerak',
  })
  about?: string;

  @ApiPropertyOptional({ example: 3, description: 'Mentor tajribasi (yil)' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  experience?: number;
}
