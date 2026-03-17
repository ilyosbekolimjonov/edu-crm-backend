import { ApiPropertyOptional } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { Type } from 'class-transformer';
import { IsEmail, IsEnum, IsInt, IsOptional, IsString, Min } from 'class-validator';

export class UpdateUserDto {
    @ApiPropertyOptional({ example: 'Ali Valiyev' })
    @IsOptional()
    @IsString()
    fullName?: string;

    @ApiPropertyOptional({ example: 'ali_valiyev' })
    @IsOptional()
    @IsString()
    username?: string;

    @ApiPropertyOptional({ example: 'ali@example.com' })
    @IsOptional()
    @IsEmail()
    email?: string;

    @ApiPropertyOptional({ example: '+998901234567' })
    @IsOptional()
    @IsString()
    phone?: string;

    @ApiPropertyOptional({ example: 'newStrongPassword123' })
    @IsOptional()
    @IsString()
    password?: string;

    @ApiPropertyOptional({ enum: UserRole })
    @IsOptional()
    @IsEnum(UserRole)
    role?: UserRole;

    @ApiPropertyOptional({ example: 'Mentor haqida qisqacha ma`lumot' })
    @IsOptional()
    @IsString()
    about?: string;

    @ApiPropertyOptional({ example: 3, description: 'Yillik tajriba' })
    @IsOptional()
    @IsInt()
    @Min(0)
    @Type(() => Number)
    experience?: number;

    @ApiPropertyOptional({ example: 'https://t.me/mentor' })
    @IsOptional()
    @IsString()
    telegram?: string;

    @ApiPropertyOptional({ example: 'https://linkedin.com/in/mentor' })
    @IsOptional()
    @IsString()
    linkedin?: string;
}
