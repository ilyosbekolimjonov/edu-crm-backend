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
import { CourseService } from './course.service';
import { CreateCourseDto } from './dto/create-course.dto';
import { UpdateCourseDto } from './dto/update-course.dto';
import { CourseQueryDto } from './dto/course-query.dto';

@ApiTags('Courses')
@Controller('courses')
export class CourseController {
  constructor(private readonly courseService: CourseService) {}

  @Post()
  @UseGuards(AtGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPERADMIN)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Yangi kurs yaratish (ADMIN, SUPERADMIN)' })
  @ApiResponse({ status: 201, description: 'Kurs yaratildi' })
  @ApiResponse({ status: 400, description: 'Mentor MENTOR rolida emas' })
  @ApiResponse({ status: 404, description: 'Mentor topilmadi' })
  create(@Body() dto: CreateCourseDto) {
    return this.courseService.create(dto);
  }

  @Get()
  @ApiOperation({ summary: "Kurslar ro'yxati (filter bilan)" })
  @ApiResponse({ status: 200, description: "Kurslar ro'yxati" })
  findAll(@Query() query: CourseQueryDto) {
    return this.courseService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Kurs tafsiloti' })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({
    status: 200,
    description: 'Kurs tafsiloti (mentor, gruplar, reyting)',
  })
  @ApiResponse({ status: 404, description: 'Kurs topilmadi' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.courseService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(AtGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPERADMIN, UserRole.MENTOR)
  @ApiBearerAuth()
  @ApiOperation({
    summary:
      "Kursni tahrirlash (ADMIN/SUPERADMIN — istalgan, MENTOR — faqat o'ziniki)",
  })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({ status: 200, description: 'Kurs yangilandi' })
  @ApiResponse({ status: 403, description: "Ruxsat yo'q" })
  @ApiResponse({ status: 404, description: 'Kurs topilmadi' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateCourseDto,
    @GetCurrentUser('sub') userId: number,
    @GetCurrentUser('role') role: UserRole,
  ) {
    return this.courseService.update(id, dto, userId, role);
  }

  @Patch(':id/publish')
  @UseGuards(AtGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPERADMIN, UserRole.MENTOR)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Kursni nashr qilish yoki nashrdan olish' })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({ status: 200, description: "Nashr holati o'zgardi" })
  @ApiResponse({ status: 403, description: "Ruxsat yo'q" })
  togglePublish(
    @Param('id', ParseIntPipe) id: number,
    @GetCurrentUser('sub') userId: number,
    @GetCurrentUser('role') role: UserRole,
  ) {
    return this.courseService.togglePublish(id, userId, role);
  }

  @Delete(':id')
  @UseGuards(AtGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPERADMIN)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Kursni o'chirish (ADMIN, SUPERADMIN)" })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({ status: 200, description: "Kurs o'chirildi" })
  @ApiResponse({ status: 404, description: 'Kurs topilmadi' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.courseService.remove(id);
  }
}
