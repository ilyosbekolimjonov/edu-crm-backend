import { Body, Controller, Get, HttpCode, HttpStatus, Post, Query, UseGuards, } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiResponse, ApiTags, } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { GetCurrentUser } from '../../common/decorators/get-current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { AtGuard } from './guards/at.guard';
import { RtGuard } from './guards/rt.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import type { JwtPayloadWithRt } from '../../common/types/jwt-payload.type';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
    constructor(private readonly authService: AuthService) { }

    @Post('register')
    @UseGuards(AtGuard, RolesGuard)
    @Roles(UserRole.ADMIN, UserRole.SUPERADMIN)
    @ApiBearerAuth()
    @HttpCode(HttpStatus.CREATED)
    @ApiOperation({ summary: `${UserRole.ADMIN}, ${UserRole.SUPERADMIN}`, })
    @ApiResponse({ status: 201, description: 'Foydalanuvchi muvaffaqiyatli yaratildi' })
    @ApiResponse({ status: 400, description: "Email, username yoki telefon allaqachon band" })
    @ApiResponse({ status: 403, description: 'Ruxsat yo\'q' })
    register(
        @Body() dto: RegisterDto,
        @GetCurrentUser('role') creatorRole: UserRole,
    ) {
        return this.authService.register(dto, creatorRole);
    }

    @Post('login')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ description: 'Email yoki username va parol orqali kirish', })
    @ApiResponse({
        status: 200,
        description: 'Muvaffaqiyatli kirildi',
        schema: {
            properties: {
                accessToken: { type: 'string' },
                refreshToken: { type: 'string' },
            },
        },
    })
    @ApiResponse({ status: 401, description: "Email/username yoki parol noto'g'ri" })
    @ApiResponse({ status: 403, description: 'Email tasdiqlanmagan' })
    login(@Body() dto: LoginDto) {
        return this.authService.login(dto);
    }

    @Get('users')
    @UseGuards(AtGuard, RolesGuard)
    @Roles(UserRole.ADMIN, UserRole.SUPERADMIN)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Foydalanuvchilar ro\'yxati (ADMIN, SUPERADMIN)' })
    @ApiQuery({ name: 'role', required: false, enum: UserRole })
    @ApiResponse({ status: 200, description: 'Foydalanuvchilar ro\'yxati' })
    getUsers(@Query('role') role?: UserRole) {
        return this.authService.getUsers(role);
    }

    @Get('verify-email')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ description: 'Email orqali yuborilgan link orqali hisobni faollashtirish', })
    @ApiQuery({ name: 'token', required: true, description: 'Email tasdiqlash tokeni' })
    @ApiResponse({ status: 200, description: 'Email muvaffaqiyatli tasdiqlandi' })
    @ApiResponse({ status: 404, description: "Noto'g'ri yoki eskirgan token" })
    verifyEmail(@Query('token') token: string) {
        return this.authService.verifyEmail(token);
    }

    @Post('refresh')
    @UseGuards(RtGuard)
    @ApiBearerAuth()
    @HttpCode(HttpStatus.OK)
    @ApiResponse({
        status: 200,
        description: 'Tokenlar yangilandi',
        schema: {
            properties: {
                accessToken: { type: 'string' },
                refreshToken: { type: 'string' },
            },
        },
    })
    @ApiResponse({ status: 403, description: 'Refresh token noto\'g\'ri yoki muddati o\'tgan' })
    refresh(@GetCurrentUser() user: JwtPayloadWithRt) {
        return this.authService.refreshTokens(user.sub, user.refreshToken);
    }
}
