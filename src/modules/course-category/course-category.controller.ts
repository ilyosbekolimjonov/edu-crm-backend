import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, ParseIntPipe, Patch, Post, UseGuards, } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiParam, ApiResponse, ApiTags, } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { AtGuard } from '../auth/guards/at.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CourseCategoryService } from './course-category.service';
import { CreateCourseCategoryDto } from './dto/create-course-category.dto';
import { UpdateCourseCategoryDto } from './dto/update-course-category.dto';

@ApiTags('Course Categories')
@Controller('course-categories')
export class CourseCategoryController {
    constructor(private readonly service: CourseCategoryService) { }

    @Post()
    @UseGuards(AtGuard, RolesGuard)
    @Roles(UserRole.ADMIN, UserRole.SUPERADMIN)
    @ApiBearerAuth()
    @HttpCode(HttpStatus.CREATED)
    @ApiOperation({ summary: 'Kategoriya yaratish (ADMIN, SUPERADMIN)' })
    @ApiResponse({ status: 201, description: 'Kategoriya yaratildi' })
    @ApiResponse({ status: 409, description: 'Bu nom allaqachon mavjud' })
    create(@Body() dto: CreateCourseCategoryDto) {
        return this.service.create(dto);
    }

    @Get()
    @ApiOperation({ summary: 'Barcha kategoriyalar' })
    @ApiResponse({ status: 200, description: 'Kategoriyalar ro\'yxati (kurslar soni bilan)' })
    findAll() {
        return this.service.findAll();
    }

    @Get(':id')
    @ApiOperation({ summary: 'Kategoriya va uning kurslari' })
    @ApiParam({ name: 'id', type: Number })
    @ApiResponse({ status: 200, description: 'Kategoriya tafsiloti' })
    @ApiResponse({ status: 404, description: 'Kategoriya topilmadi' })
    findOne(@Param('id', ParseIntPipe) id: number) {
        return this.service.findOne(id);
    }

    @Patch(':id')
    @UseGuards(AtGuard, RolesGuard)
    @Roles(UserRole.ADMIN, UserRole.SUPERADMIN)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Kategoriyani tahrirlash (ADMIN, SUPERADMIN)' })
    @ApiParam({ name: 'id', type: Number })
    @ApiResponse({ status: 200, description: 'Kategoriya yangilandi' })
    @ApiResponse({ status: 404, description: 'Kategoriya topilmadi' })
    update(
        @Param('id', ParseIntPipe) id: number,
        @Body() dto: UpdateCourseCategoryDto,
    ) {
        return this.service.update(id, dto);
    }

    @Delete(':id')
    @UseGuards(AtGuard, RolesGuard)
    @Roles(UserRole.ADMIN, UserRole.SUPERADMIN)
    @ApiBearerAuth()
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Kategoriyani o\'chirish (ADMIN, SUPERADMIN)' })
    @ApiParam({ name: 'id', type: Number })
    @ApiResponse({ status: 200, description: 'Kategoriya o\'chirildi' })
    @ApiResponse({ status: 404, description: 'Kategoriya topilmadi' })
    remove(@Param('id', ParseIntPipe) id: number) {
        return this.service.remove(id);
    }
}
