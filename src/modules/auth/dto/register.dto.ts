import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsEnum, IsInt, IsNotEmpty, IsOptional, IsString, Min, MinLength, } from 'class-validator';
import { Type } from 'class-transformer';
import { UserRole } from '@prisma/client';

export class RegisterDto {
    @ApiProperty({ example: 'Ali Valiyev', description: "To'liq ism" })
    @IsString()
    @IsNotEmpty()
    fullName: string;

    @ApiProperty({ example: 'ali_valiyev', description: 'Foydalanuvchi nomi' })
    @IsString()
    @IsNotEmpty()
    username: string;

    @ApiProperty({ example: 'ali@example.com', description: 'Email manzil' })
    @IsEmail({}, { message: "To'g'ri email kiriting" })
    @IsNotEmpty()
    email: string;

    @ApiProperty({ example: '+998901234567', description: 'Telefon raqam' })
    @IsString()
    @IsNotEmpty()
    phone: string;

    @ApiProperty({ example: 'Secret@123', description: 'Parol (kamida 6 belgi)' })
    @IsString()
    @MinLength(6, { message: "Parol kamida 6 belgidan iborat bo'lishi kerak" })
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
    @IsEnum([UserRole.ADMIN, UserRole.MENTOR, UserRole.ASSISTANT, UserRole.STUDENT], { message: "Noto'g'ri rol" })
    role?: UserRole;

    @ApiPropertyOptional({ example: 'https://t.me/username', description: 'Mentor telegram havolasi' })
    @IsOptional()
    @IsString()
    telegram?: string;

    @ApiPropertyOptional({ example: 'https://linkedin.com/in/username', description: 'Mentor linkedin havolasi' })
    @IsOptional()
    @IsString()
    linkedin?: string;

    @ApiPropertyOptional({ example: 'Frontend va React bo\'yicha mentor', description: 'Mentor haqida qisqa ma\'lumot' })
    @IsOptional()
    @IsString()
    about?: string;

    @ApiPropertyOptional({ example: 3, description: 'Mentor tajribasi (yil)' })
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(0)
    experience?: number;
}
