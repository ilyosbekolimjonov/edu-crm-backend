import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, ParseIntPipe, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiParam, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { AtGuard } from '../auth/guards/at.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { RoomService } from './room.service';
import { CreateRoomDto } from './dto/create-room.dto';
import { UpdateRoomDto } from './dto/update-room.dto';

@ApiTags('Rooms')
@Controller('rooms')
export class RoomController {
    constructor(private readonly service: RoomService) { }

    @Post()
    @UseGuards(AtGuard, RolesGuard)
    @Roles(UserRole.ADMIN, UserRole.SUPERADMIN)
    @ApiBearerAuth()
    @HttpCode(HttpStatus.CREATED)
    @ApiOperation({ summary: 'Yangi xona yaratish (ADMIN, SUPERADMIN)' })
    @ApiResponse({ status: 201, description: 'Xona yaratildi' })
    @ApiResponse({ status: 409, description: 'Bu nomli xona allaqachon mavjud' })
    create(@Body() dto: CreateRoomDto) {
        return this.service.create(dto);
    }

    @Get()
    @UseGuards(AtGuard, RolesGuard)
    @Roles(UserRole.ADMIN, UserRole.SUPERADMIN)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Barcha xonalar ro\'yxati (ADMIN, SUPERADMIN)' })
    @ApiQuery({ name: 'onlyActive', required: false, type: Boolean, description: 'Faqat faol xonalar' })
    @ApiResponse({ status: 200, description: 'Xonalar ro\'yxati' })
    findAll(@Query('onlyActive') onlyActive?: string) {
        return this.service.findAll(onlyActive === 'true');
    }

    @Get(':id')
    @UseGuards(AtGuard, RolesGuard)
    @Roles(UserRole.ADMIN, UserRole.SUPERADMIN)
    @ApiBearerAuth()
    @ApiParam({ name: 'id', type: Number })
    @ApiOperation({ summary: 'Xona tafsiloti guruhlar bilan (ADMIN, SUPERADMIN)' })
    @ApiResponse({ status: 200, description: 'Xona tafsiloti' })
    @ApiResponse({ status: 404, description: 'Xona topilmadi' })
    findOne(@Param('id', ParseIntPipe) id: number) {
        return this.service.findOne(id);
    }

    @Patch(':id')
    @UseGuards(AtGuard, RolesGuard)
    @Roles(UserRole.ADMIN, UserRole.SUPERADMIN)
    @ApiBearerAuth()
    @ApiParam({ name: 'id', type: Number })
    @ApiOperation({ summary: 'Xonani tahrirlash (ADMIN, SUPERADMIN)' })
    @ApiResponse({ status: 200, description: 'Xona yangilandi' })
    @ApiResponse({ status: 404, description: 'Xona topilmadi' })
    update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateRoomDto) {
        return this.service.update(id, dto);
    }

    @Delete(':id')
    @UseGuards(AtGuard, RolesGuard)
    @Roles(UserRole.ADMIN, UserRole.SUPERADMIN)
    @ApiBearerAuth()
    @HttpCode(HttpStatus.OK)
    @ApiParam({ name: 'id', type: Number })
    @ApiOperation({ summary: 'Xonani o\'chirish — faqat faol guruhlar yo\'q bo\'lsa (ADMIN, SUPERADMIN)' })
    @ApiResponse({ status: 200, description: 'O\'chirildi' })
    @ApiResponse({ status: 409, description: 'Faol guruhlar bor' })
    remove(@Param('id', ParseIntPipe) id: number) {
        return this.service.remove(id);
    }
}
