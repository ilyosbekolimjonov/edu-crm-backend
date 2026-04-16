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
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import type { Express } from 'express';
import { existsSync, mkdirSync } from 'fs';
import { extname, join } from 'path';
import { UserRole } from '@prisma/client';
import { AtGuard } from '../auth/guards/at.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { GetCurrentUser } from '../../common/decorators/get-current-user.decorator';
import { MentorService } from './mentor.service';
import { UpdateMentorProfileDto } from './dto/update-profile.dto';
import { ReviewHomeworkDto } from './dto/review-homework.dto';
import { AnswerQuestionDto } from './dto/answer-question.dto';

@ApiTags('Mentor')
@ApiBearerAuth()
@UseGuards(AtGuard, RolesGuard)
@Roles(UserRole.MENTOR, UserRole.ADMIN, UserRole.SUPERADMIN)
@Controller('mentor')
export class MentorController {
  constructor(private readonly mentorService: MentorService) {}

  @Get('profile')
  @ApiOperation({ summary: "O'z profilini ko'rish" })
  @ApiResponse({ status: 200, description: 'Mentor profili' })
  getProfile(@GetCurrentUser('sub') userId: number) {
    return this.mentorService.getProfile(userId);
  }

  @Patch('profile')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Profilni tahrirlash' })
  @ApiResponse({ status: 200, description: 'Profil yangilandi' })
  updateProfile(
    @GetCurrentUser('sub') userId: number,
    @Body() dto: UpdateMentorProfileDto,
  ) {
    return this.mentorService.updateProfile(userId, dto);
  }

  @Get('courses')
  @ApiOperation({ summary: "O'z kurslarini ko'rish" })
  @ApiResponse({
    status: 200,
    description: "Kurslar ro'yxati (studentlar soni va reyting bilan)",
  })
  getCourses(@GetCurrentUser('sub') userId: number) {
    return this.mentorService.getCourses(userId);
  }

  @Get('courses/:courseId/students')
  @ApiOperation({ summary: "Kurs studentlarini ko'rish" })
  @ApiParam({ name: 'courseId', type: Number, description: 'Kurs ID' })
  @ApiResponse({
    status: 200,
    description: "Studentlar ro'yxati (progress bilan)",
  })
  @ApiResponse({ status: 404, description: 'Kurs topilmadi' })
  getCourseStudents(
    @GetCurrentUser('sub') userId: number,
    @Param('courseId', ParseIntPipe) courseId: number,
  ) {
    return this.mentorService.getCourseStudents(userId, courseId);
  }

  @Get('homeworks/pending')
  @ApiOperation({ summary: 'Tekshirilmagan homeworklar' })
  @ApiResponse({ status: 200, description: 'PENDING statusidagi homeworklar' })
  getPendingHomeworks(@GetCurrentUser('sub') userId: number) {
    return this.mentorService.getPendingHomeworks(userId);
  }

  @Patch('homeworks/:submissionId/review')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Homeworkni tekshirish (ACCEPTED / REJECTED)' })
  @ApiParam({
    name: 'submissionId',
    type: Number,
    description: 'Submission ID',
  })
  @ApiResponse({ status: 200, description: 'Homework tekshirildi' })
  @ApiResponse({ status: 400, description: 'REJECTED uchun reason majburiy' })
  @ApiResponse({ status: 404, description: 'Submission topilmadi' })
  reviewHomework(
    @GetCurrentUser('sub') userId: number,
    @Param('submissionId', ParseIntPipe) submissionId: number,
    @Body() dto: ReviewHomeworkDto,
  ) {
    return this.mentorService.reviewHomework(userId, submissionId, dto);
  }

  @Get('questions')
  @ApiOperation({ summary: "Student savollarini ko'rish" })
  @ApiQuery({
    name: 'courseId',
    required: false,
    type: Number,
    description: "Kurs bo'yicha filter",
  })
  @ApiQuery({
    name: 'unread',
    required: false,
    enum: ['true', 'false'],
    description: "Faqat o'qilmaganlar",
  })
  @ApiResponse({ status: 200, description: "Savollar ro'yxati" })
  getQuestions(
    @GetCurrentUser('sub') userId: number,
    @Query('courseId') courseId?: string,
    @Query('unread') unread?: string,
  ) {
    return this.mentorService.getQuestions(
      userId,
      courseId ? parseInt(courseId, 10) : undefined,
      unread,
    );
  }

  @Post('questions/:id/answer')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Savolga javob berish' })
  @ApiParam({ name: 'id', type: Number, description: 'Savol ID' })
  @ApiResponse({ status: 200, description: 'Javob yuborildi' })
  @ApiResponse({ status: 404, description: 'Savol topilmadi' })
  answerQuestion(
    @GetCurrentUser('sub') userId: number,
    @Param('id', ParseIntPipe) questionId: number,
    @Body() dto: AnswerQuestionDto,
  ) {
    return this.mentorService.answerQuestion(userId, questionId, dto);
  }

  @Get('courses/:id/analytics')
  @ApiOperation({ summary: 'Kurs statistikasi' })
  @ApiParam({ name: 'id', type: Number, description: 'Kurs ID' })
  @ApiResponse({
    status: 200,
    description: 'Kurs analitikasi',
    schema: {
      properties: {
        studentsCount: { type: 'number' },
        totalLessons: { type: 'number' },
        completedViews: { type: 'number' },
        homeworksSubmitted: { type: 'number' },
        pendingHomeworks: { type: 'number' },
        averageRating: { type: 'number' },
        ratingCount: { type: 'number' },
        unansweredQuestions: { type: 'number' },
      },
    },
  })
  @ApiResponse({ status: 404, description: 'Kurs topilmadi' })
  getCourseAnalytics(
    @GetCurrentUser('sub') userId: number,
    @Param('id', ParseIntPipe) courseId: number,
  ) {
    return this.mentorService.getCourseAnalytics(userId, courseId);
  }
}

@ApiTags('Teacher')
@ApiBearerAuth()
@UseGuards(AtGuard, RolesGuard)
@Roles(UserRole.MENTOR)
@Controller('teacher')
export class TeacherController {
  constructor(private readonly mentorService: MentorService) {}

  @Get('profile')
  @ApiOperation({ summary: "Teacher o'z profilini ko'rish" })
  @ApiResponse({ status: 200, description: 'Teacher profili' })
  getProfile(@GetCurrentUser('sub') userId: number) {
    return this.mentorService.getProfile(userId);
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
  @HttpCode(HttpStatus.OK)
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Teacher profilini tahrirlash' })
  @ApiResponse({ status: 200, description: 'Profil yangilandi' })
  updateProfile(
    @GetCurrentUser('sub') userId: number,
    @Body() dto: UpdateMentorProfileDto,
    @UploadedFile() image: Express.Multer.File | undefined,
  ) {
    const imageUrl = image ? `/uploads/users/${image.filename}` : undefined;
    return this.mentorService.updateProfile(userId, dto, imageUrl);
  }
}
