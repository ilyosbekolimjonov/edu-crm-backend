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
import { LessonService } from './lesson.service';
import { CreateLessonDto } from './dto/create-lesson.dto';
import { UpdateLessonDto } from './dto/update-lesson.dto';
import { AddLessonFileDto } from './dto/add-lesson-file.dto';
import type { JwtPayload } from '../../common/types/jwt-payload.type';

@ApiTags('Lessons')
@Controller('lessons')
export class LessonController {
        @Post(':id/files/upload')
        @UseGuards(AtGuard, RolesGuard)
        @Roles(UserRole.ADMIN, UserRole.SUPERADMIN, UserRole.MENTOR)
        @UseInterceptors(
            FileInterceptor('file', {
                storage: diskStorage({
                    destination: (_req, _file, cb) => {
                        const uploadDir = join(process.cwd(), 'uploads', 'videos');
                        if (!existsSync(uploadDir)) {
                            mkdirSync(uploadDir, { recursive: true });
                        }
                        cb(null, uploadDir);
                    },
                    filename: (_req, file, cb) => {
                        const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
                        cb(null, `video-${unique}${extname(file.originalname)}`);
                    },
                }),
                fileFilter: (_req, file, cb) => {
                    if (!file.mimetype.startsWith('video/')) {
                        cb(new Error('Faqat video fayl yuklash mumkin'), false);
                        return;
                    }
                    cb(null, true);
                },
                limits: { fileSize: 1024 * 1024 * 1024 },
            }),
        )
        @ApiBearerAuth()
        @HttpCode(HttpStatus.CREATED)
        @ApiParam({ name: 'id', type: String })
        @ApiOperation({ summary: 'Darsga video yuklab biriktirish (ADMIN, SUPERADMIN, MENTOR)' })
        @ApiResponse({ status: 201, description: 'Video yuklandi va biriktirildi' })
        uploadVideo(
            @Param('id') id: string,
            @UploadedFile() file: any,
            @Body('note') note: string | undefined,
            @GetCurrentUser() user: JwtPayload,
        ) {
            if (!file) {
                throw new BadRequestException('Video fayl yuborilmadi');
            }
            const fileUrl = `/uploads/videos/${file.filename}`;
            return this.service.addFile(id, { file: fileUrl, note }, user);
        }

    constructor(private readonly service: LessonService) { }

    @Post()
    @UseGuards(AtGuard, RolesGuard)
    @Roles(UserRole.ADMIN, UserRole.SUPERADMIN, UserRole.MENTOR)
    @ApiBearerAuth()
    @HttpCode(HttpStatus.CREATED)
    @ApiOperation({ summary: 'Yangi dars yaratish (ADMIN, SUPERADMIN, MENTOR — o\'z kursi)' })
    @ApiResponse({ status: 201, description: 'Dars yaratildi' })
    @ApiResponse({ status: 403, description: 'Bu kurs sizniki emas' })
    @ApiResponse({ status: 404, description: 'Bo\'lim topilmadi' })
    create(@Body() dto: CreateLessonDto, @GetCurrentUser() user: JwtPayload) {
        return this.service.create(dto, user);
    }

    @Get()
    @UseGuards(AtGuard)
    @ApiBearerAuth()
    @ApiQuery({ name: 'lessonGroupId', required: true, type: Number })
    @ApiOperation({ summary: 'Bo\'lim darslar ro\'yxati (ko\'rilganlik holati bilan)' })
    @ApiResponse({ status: 200, description: 'Ro\'yxat' })
    findByGroup(
        @Query('lessonGroupId', ParseIntPipe) lessonGroupId: number,
        @GetCurrentUser('sub') userId: number,
    ) {
        return this.service.findByGroup(lessonGroupId, userId);
    }

    @Get(':id')
    @UseGuards(AtGuard)
    @ApiBearerAuth()
    @ApiParam({ name: 'id', type: String })
    @ApiOperation({ summary: 'Dars tafsiloti (fayllar, homework, ko\'rilganlik)' })
    @ApiResponse({ status: 200, description: 'Dars tafsiloti' })
    @ApiResponse({ status: 404, description: 'Dars topilmadi' })
    findOne(@Param('id') id: string, @GetCurrentUser('sub') userId: number) {
        return this.service.findOne(id, userId);
    }

    @Patch(':id')
    @UseGuards(AtGuard, RolesGuard)
    @Roles(UserRole.ADMIN, UserRole.SUPERADMIN, UserRole.MENTOR)
    @ApiBearerAuth()
    @ApiParam({ name: 'id', type: String })
    @ApiOperation({ summary: 'Darsni tahrirlash (ADMIN, SUPERADMIN, MENTOR — o\'z kursi)' })
    @ApiResponse({ status: 200, description: 'Yangilandi' })
    update(@Param('id') id: string, @Body() dto: UpdateLessonDto, @GetCurrentUser() user: JwtPayload) {
        return this.service.update(id, dto, user);
    }

    @Delete(':id')
    @UseGuards(AtGuard, RolesGuard)
    @Roles(UserRole.ADMIN, UserRole.SUPERADMIN, UserRole.MENTOR)
    @ApiBearerAuth()
    @HttpCode(HttpStatus.OK)
    @ApiParam({ name: 'id', type: String })
    @ApiOperation({ summary: 'Darsni o\'chirish (ADMIN, SUPERADMIN, MENTOR — o\'z kursi)' })
    @ApiResponse({ status: 200, description: 'O\'chirildi' })
    remove(@Param('id') id: string, @GetCurrentUser() user: JwtPayload) {
        return this.service.remove(id, user);
    }

    @Post(':id/files')
    @UseGuards(AtGuard, RolesGuard)
    @Roles(UserRole.ADMIN, UserRole.SUPERADMIN, UserRole.MENTOR)
    @ApiBearerAuth()
    @HttpCode(HttpStatus.CREATED)
    @ApiParam({ name: 'id', type: String })
    @ApiOperation({ summary: 'Darsga fayl qo\'shish (ADMIN, SUPERADMIN, MENTOR)' })
    @ApiResponse({ status: 201, description: 'Fayl qo\'shildi' })
    addFile(@Param('id') id: string, @Body() dto: AddLessonFileDto, @GetCurrentUser() user: JwtPayload) {
        return this.service.addFile(id, dto, user);
    }

    @Delete(':id/files/:fileId')
    @UseGuards(AtGuard, RolesGuard)
    @Roles(UserRole.ADMIN, UserRole.SUPERADMIN, UserRole.MENTOR)
    @ApiBearerAuth()
    @HttpCode(HttpStatus.OK)
    @ApiParam({ name: 'id', type: String })
    @ApiParam({ name: 'fileId', type: Number })
    @ApiOperation({ summary: 'Dars faylini o\'chirish (ADMIN, SUPERADMIN, MENTOR)' })
    @ApiResponse({ status: 200, description: 'O\'chirildi' })
    removeFile(
        @Param('id') id: string,
        @Param('fileId', ParseIntPipe) fileId: number,
        @GetCurrentUser() user: JwtPayload,
    ) {
        return this.service.removeFile(id, fileId, user);
    }

    @Patch(':id/view')
    @UseGuards(AtGuard)
    @ApiBearerAuth()
    @HttpCode(HttpStatus.OK)
    @ApiParam({ name: 'id', type: String })
    @ApiOperation({ summary: 'Darsni ko\'rilgan deb belgilash' })
    @ApiResponse({ status: 200, description: 'Belgilandi' })
    markViewed(@Param('id') id: string, @GetCurrentUser('sub') userId: number) {
        return this.service.markViewed(id, userId);
    }
}
