import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsNotEmpty, IsString, MinLength } from 'class-validator';
import { trimString } from '../../../common/validation/helpers';

export class LoginDto {
  @ApiProperty({
    example: 'ali@example.com yoki ali_valiyev yoki +998901234567',
    description: 'Email yoki username yoki telefon raqam',
  })
  @Transform(({ value }) => trimString(value))
  @IsString()
  @IsNotEmpty()
  login: string;

  @ApiProperty({ example: 'Secret@123', description: 'Parol' })
  @Transform(({ value }) => trimString(value))
  @IsString()
  @IsNotEmpty()
  @MinLength(6, { message: "Parol kamida 6 belgidan iborat bo'lishi kerak" })
  password: string;
}
