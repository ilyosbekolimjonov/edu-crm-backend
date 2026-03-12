import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class LoginDto {
    @ApiProperty({
        example: 'ali@example.com or ali_valiyev',
        description: 'Email yoki username',
    })
    @IsString()
    @IsNotEmpty()
    login: string;

    @ApiProperty({ example: 'Secret@123', description: 'Parol' })
    @IsString()
    @IsNotEmpty()
    password: string;
}
