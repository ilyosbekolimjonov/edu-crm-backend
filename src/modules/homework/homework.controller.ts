import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, ParseIntPipe, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiParam, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
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
