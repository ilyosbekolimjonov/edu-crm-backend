import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, ParseIntPipe, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiParam, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { AtGuard } from '../auth/guards/at.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { GetCurrentUser } from '../../common/decorators/get-current-user.decorator';
import { LessonGroupService } from './lesson-group.service';
import { CreateLessonGroupDto } from './dto/create-lesson-group.dto';
import { UpdateLessonGroupDto } from './dto/update-lesson-group.dto';
import type { JwtPayload } from '../../common/types/jwt-payload.type';

@ApiTags('Lesson Groups')
@Controller('lesson-groups')
export class LessonGroupController {
    constructor(private readonly service: LessonGroupService) { }

    @Post()
    @UseGuards(AtGuard, RolesGuard)
    @Roles(UserRole.ADMIN, UserRole.SUPERADMIN, UserRole.MENTOR)
    @ApiBearerAuth()
    @HttpCode(HttpStatus.CREATED)
    @ApiOperation({ summary: 'Kurs bo\'limini yaratish (ADMIN, SUPERADMIN, MENTOR — o\'z kursi)' })
    @ApiResponse({ status: 201, description: 'Bo\'lim yaratildi' })
    @ApiResponse({ status: 403, description: 'Bu kurs sizniki emas' })
    @ApiResponse({ status: 404, description: 'Kurs topilmadi' })
    create(@Body() dto: CreateLessonGroupDto, @GetCurrentUser() user: JwtPayload) {
        return this.service.create(dto, user);
    }

    @Get()
    @UseGuards(AtGuard)
    @ApiBearerAuth()
    @ApiQuery({ name: 'courseId', required: true, type: Number })
    @ApiOperation({ summary: 'Kurs bo\'limlari ro\'yxati' })
    @ApiResponse({ status: 200, description: 'Ro\'yxat' })
    findByCourse(@Query('courseId', ParseIntPipe) courseId: number) {
        return this.service.findByCourse(courseId);
    }

    @Get(':id')
    @UseGuards(AtGuard)
    @ApiBearerAuth()
    @ApiParam({ name: 'id', type: Number })
    @ApiOperation({ summary: 'Bo\'lim tafsiloti darslar ro\'yxati bilan' })
    @ApiResponse({ status: 200, description: 'Bo\'lim tafsiloti' })
    @ApiResponse({ status: 404, description: 'Bo\'lim topilmadi' })
    findOne(@Param('id', ParseIntPipe) id: number) {
        return this.service.findOne(id);
    }

    @Patch(':id')
    @UseGuards(AtGuard, RolesGuard)
    @Roles(UserRole.ADMIN, UserRole.SUPERADMIN, UserRole.MENTOR)
    @ApiBearerAuth()
    @ApiParam({ name: 'id', type: Number })
    @ApiOperation({ summary: 'Bo\'limni tahrirlash (ADMIN, SUPERADMIN, MENTOR — o\'z kursi)' })
    @ApiResponse({ status: 200, description: 'Yangilandi' })
    update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateLessonGroupDto, @GetCurrentUser() user: JwtPayload) {
        return this.service.update(id, dto, user);
    }

    @Delete(':id')
    @UseGuards(AtGuard, RolesGuard)
    @Roles(UserRole.ADMIN, UserRole.SUPERADMIN, UserRole.MENTOR)
    @ApiBearerAuth()
    @HttpCode(HttpStatus.OK)
    @ApiParam({ name: 'id', type: Number })
    @ApiOperation({ summary: 'Bo\'limni o\'chirish (ADMIN, SUPERADMIN, MENTOR — o\'z kursi)' })
    @ApiResponse({ status: 200, description: 'O\'chirildi' })
    remove(@Param('id', ParseIntPipe) id: number, @GetCurrentUser() user: JwtPayload) {
        return this.service.remove(id, user);
    }
}
