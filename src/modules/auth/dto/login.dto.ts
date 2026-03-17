import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class LoginDto {
    @ApiProperty({
        example: 'ali@example.com yoki ali_valiyev yoki +998901234567',
        description: 'Email yoki username yoki telefon raqam',
    })
    @IsString()
    @IsNotEmpty()
    login: string;

    @ApiProperty({ example: 'Secret@123', description: 'Parol' })
    @IsString()
    @IsNotEmpty()
    password: string;
}
