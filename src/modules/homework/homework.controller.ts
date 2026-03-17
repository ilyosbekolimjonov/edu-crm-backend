import { BadRequestException, Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, ParseIntPipe, Patch, Post, Query, UploadedFile, UseGuards, UseInterceptors } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiParam, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { existsSync, mkdirSync } from 'fs';
import { AtGuard } from '../auth/guards/at.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { GetCurrentUser } from '../../common/decorators/get-current-user.decorator';
import { HomeworkService } from './homework.service';
import { CreateHomeworkDto } from './dto/create-homework.dto';
import { UpdateHomeworkDto } from './dto/update-homework.dto';
import type { JwtPayload } from '../../common/types/jwt-payload.type';

@ApiTags('Homeworks')
@Controller('homeworks')
export class HomeworkController {
        @Post('upload-file')
        @UseGuards(AtGuard, RolesGuard)
        @Roles(UserRole.ADMIN, UserRole.SUPERADMIN, UserRole.MENTOR)
        @UseInterceptors(
            FileInterceptor('file', {
                storage: diskStorage({
                    destination: (_req, _file, cb) => {
                        const uploadDir = join(process.cwd(), 'uploads', 'homeworks');
                        if (!existsSync(uploadDir)) {
                            mkdirSync(uploadDir, { recursive: true });
                        }
                        cb(null, uploadDir);
                    },
                    filename: (_req, file, cb) => {
                        const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
                        cb(null, `homework-${unique}${extname(file.originalname)}`);
                    },
                }),
                limits: { fileSize: 200 * 1024 * 1024 },
            }),
        )
        @ApiBearerAuth()
        @HttpCode(HttpStatus.CREATED)
        @ApiOperation({ summary: 'Uyga vazifa uchun fayl yuklash (ADMIN, SUPERADMIN, MENTOR)' })
        @ApiResponse({ status: 201, description: 'Fayl yuklandi' })
        uploadHomeworkFile(@UploadedFile() file: any) {
            if (!file) {
                throw new BadRequestException('Fayl yuborilmadi');
            }
            return {
                fileUrl: `/uploads/homeworks/${file.filename}`,
                fileName: file.originalname,
                size: file.size,
            };
        }

    constructor(private readonly service: HomeworkService) { }

    @Post()
    @UseGuards(AtGuard, RolesGuard)
    @Roles(UserRole.ADMIN, UserRole.SUPERADMIN, UserRole.MENTOR)
    @ApiBearerAuth()
    @HttpCode(HttpStatus.CREATED)
    @ApiOperation({ summary: 'Darsga topshiriq yaratish (ADMIN, SUPERADMIN, MENTOR — o\'z kursi)' })
    @ApiResponse({ status: 201, description: 'Topshiriq yaratildi' })
    @ApiResponse({ status: 403, description: 'Bu kurs sizniki emas' })
    @ApiResponse({ status: 404, description: 'Dars topilmadi' })
    @ApiResponse({ status: 409, description: 'Bu darsda allaqachon topshiriq mavjud' })
    create(@Body() dto: CreateHomeworkDto, @GetCurrentUser() user: JwtPayload) {
        return this.service.create(dto, user);
    }

    @Get()
    @UseGuards(AtGuard)
    @ApiBearerAuth()
    @ApiQuery({ name: 'lessonId', required: true, type: String, description: 'Lesson UUID' })
    @ApiOperation({ summary: 'Dars topshirig\'ini olish' })
    @ApiResponse({ status: 200, description: 'Topshiriq' })
    @ApiResponse({ status: 404, description: 'Dars yoki topshiriq topilmadi' })
    findByLesson(@Query('lessonId') lessonId: string) {
        return this.service.findByLesson(lessonId);
    }

    @Patch(':id')
    @UseGuards(AtGuard, RolesGuard)
    @Roles(UserRole.ADMIN, UserRole.SUPERADMIN, UserRole.MENTOR)
    @ApiBearerAuth()
    @ApiParam({ name: 'id', type: Number })
    @ApiOperation({ summary: 'Topshiriqni tahrirlash (ADMIN, SUPERADMIN, MENTOR — o\'z kursi)' })
    @ApiResponse({ status: 200, description: 'Yangilandi' })
    update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateHomeworkDto, @GetCurrentUser() user: JwtPayload) {
        return this.service.update(id, dto, user);
    }

    @Delete(':id')
    @UseGuards(AtGuard, RolesGuard)
    @Roles(UserRole.ADMIN, UserRole.SUPERADMIN, UserRole.MENTOR)
    @ApiBearerAuth()
    @HttpCode(HttpStatus.OK)
    @ApiParam({ name: 'id', type: Number })
    @ApiOperation({ summary: 'Topshiriqni o\'chirish (ADMIN, SUPERADMIN, MENTOR — o\'z kursi)' })
    @ApiResponse({ status: 200, description: 'O\'chirildi' })
    remove(@Param('id', ParseIntPipe) id: number, @GetCurrentUser() user: JwtPayload) {
        return this.service.remove(id, user);
    }
}
