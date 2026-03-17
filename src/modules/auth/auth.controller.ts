import { BadRequestException, Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, ParseIntPipe, Patch, Post, Query, UploadedFile, UseGuards, UseInterceptors, } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiResponse, ApiTags, } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { existsSync, mkdirSync } from 'fs';
import { extname, join } from 'path';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { GetCurrentUser } from '../../common/decorators/get-current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { AtGuard } from './guards/at.guard';
import { RtGuard } from './guards/rt.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import type { JwtPayloadWithRt } from '../../common/types/jwt-payload.type';
import { UpdateUserDto } from './dto/update-user.dto';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
    constructor(private readonly authService: AuthService) { }

    @Post('upload-image')
    @UseGuards(AtGuard, RolesGuard)
    @Roles(UserRole.ADMIN, UserRole.SUPERADMIN)
    @UseInterceptors(
        FileInterceptor('file', {
            storage: diskStorage({
                destination: (_req, _file, cb) => {
                    const uploadDir = join(process.cwd(), 'uploads', 'users');
                    if (!existsSync(uploadDir)) {
                        mkdirSync(uploadDir, { recursive: true });
                    }
                    cb(null, uploadDir);
                },
                filename: (_req, file, cb) => {
                    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
                    cb(null, `user-${unique}${extname(file.originalname)}`);
                },
            }),
            fileFilter: (_req, file, cb) => {
                if (!file.mimetype.startsWith('image/')) {
                    cb(new Error('Faqat rasm fayl yuklash mumkin'), false);
                    return;
                }
                cb(null, true);
            },
            limits: { fileSize: 10 * 1024 * 1024 },
        }),
    )
    @ApiBearerAuth()
    @HttpCode(HttpStatus.CREATED)
    @ApiOperation({ summary: 'Foydalanuvchi rasmi yuklash (ADMIN, SUPERADMIN)' })
    @ApiResponse({ status: 201, description: 'Rasm yuklandi' })
    uploadImage(@UploadedFile() file: any) {
        if (!file) {
            throw new BadRequestException('Rasm fayl yuborilmadi');
        }

        return {
            imageUrl: `/uploads/users/${file.filename}`,
            fileName: file.originalname,
            size: file.size,
        };
    }

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

    @Patch('users/:id')
    @UseGuards(AtGuard, RolesGuard)
    @Roles(UserRole.ADMIN, UserRole.SUPERADMIN)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Foydalanuvchini tahrirlash (ADMIN, SUPERADMIN)' })
    @ApiResponse({ status: 200, description: 'Foydalanuvchi yangilandi' })
    @ApiResponse({ status: 404, description: 'Foydalanuvchi topilmadi' })
    updateUser(
        @Param('id', ParseIntPipe) id: number,
        @Body() dto: UpdateUserDto,
        @GetCurrentUser('sub') currentUserId: number,
        @GetCurrentUser('role') currentUserRole: UserRole,
    ) {
        return this.authService.updateUser(id, dto, currentUserId, currentUserRole);
    }

    @Delete('users/:id')
    @UseGuards(AtGuard, RolesGuard)
    @Roles(UserRole.ADMIN, UserRole.SUPERADMIN)
    @ApiBearerAuth()
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Foydalanuvchini o\'chirish (ADMIN, SUPERADMIN)' })
    @ApiResponse({ status: 200, description: 'Foydalanuvchi o\'chirildi' })
    @ApiResponse({ status: 404, description: 'Foydalanuvchi topilmadi' })
    removeUser(
        @Param('id', ParseIntPipe) id: number,
        @GetCurrentUser('sub') currentUserId: number,
        @GetCurrentUser('role') currentUserRole: UserRole,
    ) {
        return this.authService.removeUser(id, currentUserId, currentUserRole);
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
