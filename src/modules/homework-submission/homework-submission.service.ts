import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { HomeworkSubStatus, UserRole } from '@prisma/client';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CreateSubmissionDto } from './dto/create-submission.dto';
import { ReviewSubmissionDto } from './dto/review-submission.dto';
import { SubmissionQueryDto } from './dto/submission-query.dto';
import type { JwtPayload } from '../../common/types/jwt-payload.type';

const submissionInclude = {
  user: { select: { id: true, fullName: true, email: true, phone: true } },
  homework: {
    select: {
      id: true,
      task: true,
      lesson: {
        select: {
          id: true,
          name: true,
          group: {
            select: {
              id: true,
              name: true,
              course: { select: { id: true, name: true, mentorId: true } },
            },
          },
        },
      },
    },
  },
};

@Injectable()
export class HomeworkSubmissionService {
  constructor(private readonly prisma: PrismaService) {}

  async submit(dto: CreateSubmissionDto, user: JwtPayload) {
    const homework = await this.prisma.homework.findUnique({
      where: { id: dto.homeworkId },
    });
    if (!homework) throw new NotFoundException('Topshiriq topilmadi');

    const existing = await this.prisma.homeworkSubmission.findFirst({
      where: { homeworkId: dto.homeworkId, userId: user.sub },
    });
    if (existing)
      throw new ConflictException('Siz bu topshiriqni allaqachon yuborgansiz');

    return this.prisma.homeworkSubmission.create({
      data: {
        homeworkId: dto.homeworkId,
        userId: user.sub,
        file: dto.file,
        text: dto.text,
      },
      include: submissionInclude,
    });
  }

  async findAll(query: SubmissionQueryDto, user: JwtPayload) {
    const where: Record<string, unknown> = {};

    if (query.homeworkId) where.homeworkId = query.homeworkId;
    if (query.userId) where.userId = query.userId;
    if (query.status) where.status = query.status;

    if (user.role === UserRole.MENTOR) {
      where.homework = {
        lesson: { group: { course: { mentorId: user.sub } } },
      };
    }

    return this.prisma.homeworkSubmission.findMany({
      where,
      include: submissionInclude,
      orderBy: { createdAt: 'desc' },
    });
  }

  async findMy(user: JwtPayload) {
    return this.prisma.homeworkSubmission.findMany({
      where: { userId: user.sub },
      include: {
        homework: {
          select: {
            id: true,
            task: true,
            lesson: { select: { id: true, name: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: number, user: JwtPayload) {
    const submission = await this.prisma.homeworkSubmission.findUnique({
      where: { id },
      include: submissionInclude,
    });
    if (!submission) throw new NotFoundException('Topshirilma topilmadi');

    if (user.role === UserRole.STUDENT && submission.userId !== user.sub) {
      throw new ForbiddenException('Bu topshirilma sizniki emas');
    }

    if (user.role === UserRole.MENTOR) {
      const mentorId = submission.homework.lesson.group.course.mentorId;
      if (mentorId !== user.sub)
        throw new ForbiddenException('Bu kurs sizniki emas');
    }

    return submission;
  }

  async review(id: number, dto: ReviewSubmissionDto, user: JwtPayload) {
    const submission = await this.prisma.homeworkSubmission.findUnique({
      where: { id },
      include: {
        homework: {
          include: {
            lesson: {
              include: {
                group: { include: { course: { select: { mentorId: true } } } },
              },
            },
          },
        },
      },
    });
    if (!submission) throw new NotFoundException('Topshirilma topilmadi');

    if (submission.status !== HomeworkSubStatus.PENDING) {
      throw new ConflictException('Bu topshirilma allaqachon tekshirilgan');
    }

    if (user.role === UserRole.MENTOR) {
      const mentorId = submission.homework.lesson.group.course.mentorId;
      if (mentorId !== user.sub)
        throw new ForbiddenException('Bu kurs sizniki emas');
    }

    return this.prisma.homeworkSubmission.update({
      where: { id },
      data: {
        status: dto.status,
        reason: dto.reason,
        checkedBy: user.sub,
        updatedAt: new Date(),
      },
      include: submissionInclude,
    });
  }
}
