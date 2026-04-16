import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiConsumes,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import type { Express } from 'express';
import { extname, join } from 'path';
import { existsSync, mkdirSync } from 'fs';
import { GetCurrentUser } from '../../common/decorators/get-current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import type { JwtPayload } from '../../common/types/jwt-payload.type';
import { AtGuard } from '../auth/guards/at.guard';
import { AttendanceQueryDto } from './dto/attendance-query.dto';
import { CreateStudentSubmissionDto } from './dto/create-student-submission.dto';
import { UpdateStudentProfileDto } from './dto/update-student-profile.dto';
import { StudentService } from './student.service';

@ApiTags('Student')
@ApiBearerAuth()
@UseGuards(AtGuard, RolesGuard)
@Roles(UserRole.STUDENT)
@Controller('student')
export class StudentController {
  constructor(private readonly service: StudentService) {}

  @Get('dashboard')
  @ApiOperation({ summary: 'Student dashboard summary' })
  @ApiResponse({ status: 200, description: 'Dashboard summary' })
  getDashboard(@GetCurrentUser() user: JwtPayload) {
    return this.service.getDashboard(user.sub);
  }

  @Get('groups')
  @ApiOperation({ summary: "Studentning o'z guruhlari" })
  getGroups(@GetCurrentUser() user: JwtPayload) {
    return this.service.getGroups(user.sub);
  }

  @Get('lessons')
  @ApiOperation({ summary: "Student guruhlaridagi darslar ro'yxati" })
  getLessons(@GetCurrentUser() user: JwtPayload) {
    return this.service.getLessons(user.sub);
  }

  @Get('lessons/:id')
  @ApiParam({ name: 'id', type: String })
  @ApiOperation({ summary: 'Student dars tafsiloti va auto view' })
  getLesson(@Param('id') id: string, @GetCurrentUser() user: JwtPayload) {
    return this.service.getLesson(id, user.sub);
  }

  @Get('homeworks')
  @ApiOperation({ summary: "Student topshiriqlari ro'yxati" })
  getHomeworks(@GetCurrentUser() user: JwtPayload) {
    return this.service.getHomeworks(user.sub);
  }

  @Post('homeworks/:id/submission')
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
          cb(null, `submission-${unique}${extname(file.originalname)}`);
        },
      }),
      limits: { files: 1, fileSize: 200 * 1024 * 1024 },
    }),
  )
  @ApiConsumes('multipart/form-data')
  @HttpCode(HttpStatus.CREATED)
  @ApiParam({ name: 'id', type: Number })
  @ApiOperation({ summary: 'Student homework submission yaratish' })
  submitHomework(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: CreateStudentSubmissionDto,
    @UploadedFile() file: Express.Multer.File | undefined,
    @GetCurrentUser() user: JwtPayload,
  ) {
    const fileUrl = file ? `/uploads/homeworks/${file.filename}` : undefined;
    return this.service.submitHomework(id, dto, user.sub, fileUrl);
  }

  @Get('attendance')
  @ApiOperation({ summary: "Student davomatini o'qish" })
  getAttendance(
    @Query() query: AttendanceQueryDto,
    @GetCurrentUser() user: JwtPayload,
  ) {
    return this.service.getAttendance(user.sub, query);
  }

  @Get('profile')
  @ApiOperation({ summary: 'Current student profile' })
  getProfile(@GetCurrentUser() user: JwtPayload) {
    return this.service.getProfile(user.sub);
  }

  @Patch('profile')
  @UseInterceptors(
    FileInterceptor('image', {
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
      limits: { files: 1, fileSize: 10 * 1024 * 1024 },
    }),
  )
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Current student profile update' })
  updateProfile(
    @Body() dto: UpdateStudentProfileDto,
    @UploadedFile() image: Express.Multer.File | undefined,
    @GetCurrentUser() user: JwtPayload,
  ) {
    const imageUrl = image ? `/uploads/users/${image.filename}` : undefined;
    return this.service.updateProfile(user.sub, dto, imageUrl);
  }
}
