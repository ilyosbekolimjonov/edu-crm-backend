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
import { HomeworkSubmissionService } from './homework-submission.service';
import { CreateSubmissionDto } from './dto/create-submission.dto';
import { ReviewSubmissionDto } from './dto/review-submission.dto';
import { SubmissionQueryDto } from './dto/submission-query.dto';
import type { JwtPayload } from '../../common/types/jwt-payload.type';

@ApiTags('Homework Submissions')
@Controller('homework-submissions')
export class HomeworkSubmissionController {
  constructor(private readonly service: HomeworkSubmissionService) {}

  @Post()
  @UseGuards(AtGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Topshiriqni yuborish (har qanday autentifikatsiya qilingan)',
  })
  @ApiResponse({ status: 201, description: 'Topshirildi' })
  @ApiResponse({ status: 404, description: 'Topshiriq topilmadi' })
  @ApiResponse({ status: 409, description: 'Allaqachon yuborilgan' })
  submit(@Body() dto: CreateSubmissionDto, @GetCurrentUser() user: JwtPayload) {
    return this.service.submit(dto, user);
  }

  @Get()
  @UseGuards(AtGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPERADMIN, UserRole.MENTOR)
  @ApiBearerAuth()
  @ApiOperation({
    summary:
      "Barcha topshirilmalar (ADMIN/SUPERADMIN — hammasi, MENTOR — faqat o'z kurslariniki)",
  })
  @ApiResponse({ status: 200, description: "Ro'yxat" })
  findAll(
    @Query() query: SubmissionQueryDto,
    @GetCurrentUser() user: JwtPayload,
  ) {
    return this.service.findAll(query, user);
  }

  @Get('my')
  @UseGuards(AtGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "O'zining topshirilmalari" })
  @ApiResponse({ status: 200, description: "Ro'yxat" })
  findMy(@GetCurrentUser() user: JwtPayload) {
    return this.service.findMy(user);
  }

  @Get(':id')
  @UseGuards(AtGuard)
  @ApiBearerAuth()
  @ApiParam({ name: 'id', type: Number })
  @ApiOperation({ summary: 'Bitta topshirilma tafsiloti' })
  @ApiResponse({ status: 200, description: 'Tafsilot' })
  @ApiResponse({ status: 403, description: "Ruxsat yo'q" })
  @ApiResponse({ status: 404, description: 'Topilmadi' })
  findOne(
    @Param('id', ParseIntPipe) id: number,
    @GetCurrentUser() user: JwtPayload,
  ) {
    return this.service.findOne(id, user);
  }

  @Patch(':id/review')
  @UseGuards(AtGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPERADMIN, UserRole.MENTOR)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiParam({ name: 'id', type: Number })
  @ApiOperation({
    summary:
      "Topshirilmani tekshirish: APPROVED / REJECTED (ADMIN, SUPERADMIN, MENTOR — o'z kursi)",
  })
  @ApiResponse({ status: 200, description: 'Tekshirildi' })
  @ApiResponse({ status: 403, description: 'Bu kurs sizniki emas' })
  @ApiResponse({ status: 409, description: 'Allaqachon tekshirilgan' })
  review(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: ReviewSubmissionDto,
    @GetCurrentUser() user: JwtPayload,
  ) {
    return this.service.review(id, dto, user);
  }
}
