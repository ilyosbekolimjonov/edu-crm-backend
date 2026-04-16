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
import type { JwtPayload } from '../../common/types/jwt-payload.type';
import { GroupService } from './group.service';
import { CreateGroupDto } from './dto/create-group.dto';
import { UpdateGroupDto } from './dto/update-group.dto';
import { GroupQueryDto } from './dto/group-query.dto';
import { AddStudentDto } from './dto/add-student.dto';
import { SetAttendanceDto } from './dto/set-attendance.dto';
import { RemoveAttendanceDto } from './dto/remove-attendance.dto';
import { BulkAttendanceDto } from './dto/bulk-attendance.dto';

@ApiTags('Groups')
@Controller('groups')
export class GroupController {
  constructor(private readonly service: GroupService) {}

  @Post()
  @UseGuards(AtGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPERADMIN)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Yangi guruh yaratish (ADMIN, SUPERADMIN)' })
  @ApiResponse({ status: 201, description: 'Guruh yaratildi' })
  @ApiResponse({ status: 400, description: 'Mentor MENTOR rolida emas' })
  @ApiResponse({ status: 404, description: 'Kurs yoki xona topilmadi' })
  @ApiResponse({
    status: 409,
    description: 'Nom band yoki xonada vaqt konflikti',
  })
  create(@Body() dto: CreateGroupDto) {
    return this.service.create(dto);
  }

  @Get()
  @UseGuards(AtGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPERADMIN, UserRole.MENTOR)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Guruhlar ro'yxati (ADMIN, SUPERADMIN, MENTOR)" })
  @ApiResponse({ status: 200, description: "Ro'yxat" })
  findAll(@Query() query: GroupQueryDto, @GetCurrentUser() user: JwtPayload) {
    return this.service.findAll(query, user);
  }

  @Get(':id')
  @UseGuards(AtGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPERADMIN, UserRole.MENTOR)
  @ApiBearerAuth()
  @ApiParam({ name: 'id', type: Number })
  @ApiOperation({
    summary:
      "Guruh tafsiloti talabalar ro'yxati bilan (ADMIN, SUPERADMIN, MENTOR)",
  })
  @ApiResponse({ status: 200, description: 'Guruh tafsiloti' })
  @ApiResponse({ status: 404, description: 'Guruh topilmadi' })
  findOne(
    @Param('id', ParseIntPipe) id: number,
    @GetCurrentUser() user: JwtPayload,
  ) {
    return this.service.findOne(id, user);
  }

  @Patch(':id')
  @UseGuards(AtGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPERADMIN)
  @ApiBearerAuth()
  @ApiParam({ name: 'id', type: Number })
  @ApiOperation({ summary: 'Guruhni tahrirlash (ADMIN, SUPERADMIN)' })
  @ApiResponse({ status: 200, description: 'Yangilandi' })
  @ApiResponse({ status: 404, description: 'Guruh topilmadi' })
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateGroupDto) {
    return this.service.update(id, dto);
  }

  @Post(':id/students')
  @UseGuards(AtGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPERADMIN)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.CREATED)
  @ApiParam({ name: 'id', type: Number })
  @ApiOperation({ summary: "Guruhga talaba qo'shish (ADMIN, SUPERADMIN)" })
  @ApiResponse({ status: 201, description: "Talaba qo'shildi" })
  @ApiResponse({
    status: 404,
    description: 'Guruh yoki foydalanuvchi topilmadi',
  })
  @ApiResponse({ status: 409, description: "Joy yo'q yoki allaqachon guruhda" })
  addStudent(
    @Param('id', ParseIntPipe) groupId: number,
    @Body() dto: AddStudentDto,
  ) {
    return this.service.addStudent(groupId, dto);
  }

  @Delete(':id/students/:userId')
  @UseGuards(AtGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPERADMIN)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiParam({ name: 'id', type: Number })
  @ApiParam({ name: 'userId', type: Number })
  @ApiOperation({ summary: 'Talabani guruhdan chiqarish (ADMIN, SUPERADMIN)' })
  @ApiResponse({ status: 200, description: 'Chiqarildi' })
  @ApiResponse({ status: 404, description: 'Topilmadi' })
  removeStudent(
    @Param('id', ParseIntPipe) groupId: number,
    @Param('userId', ParseIntPipe) userId: number,
  ) {
    return this.service.removeStudent(groupId, userId);
  }

  @Delete(':id')
  @UseGuards(AtGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPERADMIN)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiParam({ name: 'id', type: Number })
  @ApiOperation({ summary: "Guruhni o'chirish (ADMIN, SUPERADMIN)" })
  @ApiResponse({ status: 200, description: "O'chirildi" })
  @ApiResponse({ status: 404, description: 'Guruh topilmadi' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.service.remove(id);
  }

  @Get(':id/attendance')
  @UseGuards(AtGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPERADMIN, UserRole.MENTOR)
  @ApiBearerAuth()
  @ApiParam({ name: 'id', type: Number })
  @ApiOperation({ summary: "Guruh davomatini oy bo'yicha olish" })
  getAttendance(
    @Param('id', ParseIntPipe) groupId: number,
    @GetCurrentUser() user: JwtPayload,
    @Query('month') month?: string,
  ) {
    return this.service.getAttendance(groupId, month, user);
  }

  @Patch(':id/attendance/bulk')
  @UseGuards(AtGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPERADMIN, UserRole.MENTOR)
  @ApiBearerAuth()
  @ApiParam({ name: 'id', type: Number })
  @ApiOperation({ summary: 'Guruh davomatini bulk saqlash' })
  bulkSaveAttendance(
    @Param('id', ParseIntPipe) groupId: number,
    @Body() dto: BulkAttendanceDto,
    @GetCurrentUser() user: JwtPayload,
  ) {
    return this.service.bulkSaveAttendance(groupId, dto, user);
  }

  @Patch(':id/attendance')
  @UseGuards(AtGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPERADMIN, UserRole.MENTOR)
  @ApiBearerAuth()
  @ApiParam({ name: 'id', type: Number })
  @ApiOperation({ summary: 'Guruh davomatini belgilash' })
  setAttendance(
    @Param('id', ParseIntPipe) groupId: number,
    @Body() dto: SetAttendanceDto,
    @GetCurrentUser() user: JwtPayload,
  ) {
    return this.service.setAttendance(groupId, dto, user);
  }

  @Delete(':id/attendance')
  @UseGuards(AtGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPERADMIN, UserRole.MENTOR)
  @ApiBearerAuth()
  @ApiParam({ name: 'id', type: Number })
  @ApiOperation({ summary: "Guruh davomat yozuvini o'chirish" })
  removeAttendance(
    @Param('id', ParseIntPipe) groupId: number,
    @Query() query: RemoveAttendanceDto,
    @GetCurrentUser() user: JwtPayload,
  ) {
    return this.service.removeAttendance(groupId, query.userId, query.date, user);
  }
}
