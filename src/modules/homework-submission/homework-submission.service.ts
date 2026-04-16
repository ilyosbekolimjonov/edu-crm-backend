import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CreateSubmissionDto } from './dto/create-submission.dto';
import { ReviewSubmissionDto } from './dto/review-submission.dto';
import { SubmissionQueryDto } from './dto/submission-query.dto';
import type { JwtPayload } from '../../common/types/jwt-payload.type';

const submissionInclude = {
  user: {
    select: { id: true, fullName: true, email: true, phone: true, image: true },
  },
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

const formatSubmission = (submission: any) => ({
  id: submission.id,
  homeworkId: submission.homeworkId,
  userId: submission.userId,
  studentId: submission.userId,
  studentFullName: submission.user?.fullName,
  student: submission.user,
  user: submission.user,
  content: submission.text,
  text: submission.text,
  fileUrl: submission.file,
  file: submission.file,
  status: submission.status,
  score: submission.score,
  comment: submission.comment ?? submission.reason,
  reason: submission.reason,
  checkedBy: submission.checkedBy,
  createdAt: submission.createdAt,
  updatedAt: submission.updatedAt,
  homework: submission.homework,
});

@Injectable()
export class HomeworkSubmissionService {
  constructor(private readonly prisma: PrismaService) {}

  private checkMentorGroupAccess(
    group: {
      mentorId: number;
      mentorAssignments?: { mentorId: number }[];
    },
    user: JwtPayload,
  ) {
    if (user.role !== UserRole.MENTOR) return;

    const allowed =
      group.mentorId === user.sub ||
      (group.mentorAssignments ?? []).some(
        (item) => item.mentorId === user.sub,
      );

    if (!allowed) {
      throw new ForbiddenException('Bu kurs sizniki emas');
    }
  }

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

    const submission = await this.prisma.homeworkSubmission.create({
      data: {
        homeworkId: dto.homeworkId,
        userId: user.sub,
        file: dto.file,
        text: dto.text,
      },
      include: submissionInclude,
    });
    return formatSubmission(submission);
  }

  async findAll(query: SubmissionQueryDto, user: JwtPayload) {
    const where: Record<string, unknown> = {};

    if (query.homeworkId) where.homeworkId = query.homeworkId;
    if (query.userId) where.userId = query.userId;
    if (query.status) where.status = query.status;

    if (user.role === UserRole.MENTOR) {
      where.homework = {
        lesson: {
          group: {
            OR: [
              { mentorId: user.sub },
              { mentorAssignments: { some: { mentorId: user.sub } } },
            ],
          },
        },
      };
    }

    const submissions = await this.prisma.homeworkSubmission.findMany({
      where,
      include: submissionInclude,
      orderBy: { createdAt: 'desc' },
    });
    return submissions.map(formatSubmission);
  }

  async findByHomework(homeworkId: number, user: JwtPayload) {
    const homework = await this.prisma.homework.findUnique({
      where: { id: homeworkId },
      include: {
        lesson: {
          include: {
            group: {
              include: {
                course: { select: { id: true, name: true, mentorId: true } },
                mentorAssignments: { select: { mentorId: true } },
              },
            },
          },
        },
        submissions: {
          include: {
            user: {
              select: {
                id: true,
                fullName: true,
                email: true,
                phone: true,
                image: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!homework) throw new NotFoundException('Topshiriq topilmadi');

    if (user.role === UserRole.MENTOR) {
      this.checkMentorGroupAccess(homework.lesson.group, user);
    }

    return {
      homework: {
        id: homework.id,
        title: homework.task,
        task: homework.task,
        file: homework.file,
        fileUrl: homework.file,
        createdAt: homework.createdAt,
        updatedAt: homework.updatedAt,
      },
      lesson: {
        id: homework.lesson.id,
        title: homework.lesson.name,
        name: homework.lesson.name,
        group: {
          id: homework.lesson.group.id,
          name: homework.lesson.group.name,
          course: homework.lesson.group.course,
        },
      },
      submissions: homework.submissions.map(formatSubmission),
    };
  }

  async findMy(user: JwtPayload) {
    const submissions = await this.prisma.homeworkSubmission.findMany({
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
    return submissions.map(formatSubmission);
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
      const group = await this.prisma.group.findUnique({
        where: { id: submission.homework.lesson.group.id },
        select: {
          mentorId: true,
          mentorAssignments: { select: { mentorId: true } },
        },
      });
      if (!group) throw new NotFoundException('Guruh topilmadi');
      this.checkMentorGroupAccess(group, user);
    }

    return formatSubmission(submission);
  }

  async review(id: number, dto: ReviewSubmissionDto, user: JwtPayload) {
    const submission = await this.prisma.homeworkSubmission.findUnique({
      where: { id },
      include: {
        homework: {
          include: {
            lesson: {
              include: {
                group: {
                  include: {
                    course: { select: { mentorId: true } },
                    mentorAssignments: { select: { mentorId: true } },
                  },
                },
              },
            },
          },
        },
      },
    });
    if (!submission) throw new NotFoundException('Topshirilma topilmadi');

    if (user.role === UserRole.MENTOR) {
      this.checkMentorGroupAccess(submission.homework.lesson.group, user);
    }

    const updated = await this.prisma.homeworkSubmission.update({
      where: { id },
      data: {
        status: dto.status,
        score: dto.score,
        comment: dto.comment,
        reason: dto.comment,
        checkedBy: user.sub,
        updatedAt: new Date(),
      },
      include: submissionInclude,
    });
    return formatSubmission(updated);
  }
}
