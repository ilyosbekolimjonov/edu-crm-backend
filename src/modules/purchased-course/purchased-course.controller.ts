import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { AtGuard } from '../auth/guards/at.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { GetCurrentUser } from '../../common/decorators/get-current-user.decorator';
import { PurchasedCourseService } from './purchased-course.service';
import { CreatePurchasedCourseDto } from './dto/create-purchased-course.dto';
import { UpdatePurchasedCourseDto } from './dto/update-purchased-course.dto';
import { PurchasedCourseQueryDto } from './dto/purchased-course-query.dto';

@ApiTags('Purchased Courses')
@Controller('purchased-courses')
export class PurchasedCourseController {
  constructor(private readonly service: PurchasedCourseService) {}

  @Post()
  @UseGuards(AtGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPERADMIN)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Kurs sotib olish yozuvini yaratish (ADMIN, SUPERADMIN)',
  })
  @ApiResponse({ status: 201, description: 'Yozuv yaratildi' })
  @ApiResponse({
    status: 404,
    description: 'Foydalanuvchi, kurs yoki mentor topilmadi',
  })
  @ApiResponse({
    status: 409,
    description: 'Foydalanuvchi ushbu kursni allaqachon sotib olgan',
  })
  create(@Body() dto: CreatePurchasedCourseDto) {
    return this.service.create(dto);
  }

  @Get()
  @UseGuards(AtGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPERADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Barcha sotib olingan kurslar (ADMIN, SUPERADMIN)' })
  @ApiResponse({ status: 200, description: "Ro'yxat" })
  findAll(@Query() query: PurchasedCourseQueryDto) {
    return this.service.findAll(query);
  }

  @Get('my')
  @UseGuards(AtGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "O'zining sotib olingan kurslari" })
  @ApiResponse({ status: 200, description: "Ro'yxat" })
  findMy(@GetCurrentUser('sub') userId: number) {
    return this.service.findMy(userId);
  }

  @Get(':userId/:courseId')
  @UseGuards(AtGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPERADMIN)
  @ApiBearerAuth()
  @ApiParam({ name: 'userId', type: Number })
  @ApiParam({ name: 'courseId', type: Number })
  @ApiOperation({ summary: 'Bitta yozuv tafsiloti (ADMIN, SUPERADMIN)' })
  @ApiResponse({ status: 200, description: 'Yozuv' })
  @ApiResponse({ status: 404, description: 'Topilmadi' })
  findOne(
    @Param('userId', ParseIntPipe) userId: number,
    @Param('courseId', ParseIntPipe) courseId: number,
  ) {
    return this.service.findOne(userId, courseId);
  }

  @Patch(':userId/:courseId')
  @UseGuards(AtGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPERADMIN)
  @ApiBearerAuth()
  @ApiParam({ name: 'userId', type: Number })
  @ApiParam({ name: 'courseId', type: Number })
  @ApiOperation({ summary: 'Yozuvni yangilash (ADMIN, SUPERADMIN)' })
  @ApiResponse({ status: 200, description: 'Yangilandi' })
  @ApiResponse({ status: 404, description: 'Topilmadi' })
  update(
    @Param('userId', ParseIntPipe) userId: number,
    @Param('courseId', ParseIntPipe) courseId: number,
    @Body() dto: UpdatePurchasedCourseDto,
  ) {
    return this.service.update(userId, courseId, dto);
  }

  @Delete(':userId/:courseId')
  @UseGuards(AtGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPERADMIN)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiParam({ name: 'userId', type: Number })
  @ApiParam({ name: 'courseId', type: Number })
  @ApiOperation({ summary: "Yozuvni o'chirish (ADMIN, SUPERADMIN)" })
  @ApiResponse({ status: 200, description: "O'chirildi" })
  @ApiResponse({ status: 404, description: 'Topilmadi' })
  remove(
    @Param('userId', ParseIntPipe) userId: number,
    @Param('courseId', ParseIntPipe) courseId: number,
  ) {
    return this.service.remove(userId, courseId);
  }
}
