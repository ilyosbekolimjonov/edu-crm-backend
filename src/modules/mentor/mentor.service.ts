import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { HomeworkSubStatus } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../../common/prisma/prisma.service';
import { UpdateMentorProfileDto } from './dto/update-profile.dto';
import { ReviewHomeworkDto } from './dto/review-homework.dto';
import { AnswerQuestionDto } from './dto/answer-question.dto';

@Injectable()
export class MentorService {
  constructor(private readonly prisma: PrismaService) {}

  async getProfile(userId: number) {
    const mentor = await this.prisma.mentor.findUnique({
      where: { userId },
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            email: true,
            username: true,
            phone: true,
            image: true,
            role: true,
            createdAt: true,
          },
        },
      },
    });

    if (!mentor) {
      throw new NotFoundException('Mentor profili topilmadi');
    }

    return mentor;
  }

  async updateProfile(
    userId: number,
    dto: UpdateMentorProfileDto,
    image?: string,
  ) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('Foydalanuvchi topilmadi');

    if (dto.username && dto.username !== user.username) {
      const exists = await this.prisma.user.findUnique({
        where: { username: dto.username },
      });
      if (exists) throw new ConflictException('Bu username allaqachon band');
    }

    if (dto.phone && dto.phone !== user.phone) {
      const exists = await this.prisma.user.findUnique({
        where: { phone: dto.phone },
      });
      if (exists)
        throw new ConflictException('Bu telefon raqam allaqachon band');
    }

    const userData: Record<string, unknown> = {
      fullName: dto.fullName,
      username: dto.username,
      phone: dto.phone,
      image,
    };

    if (dto.password) {
      if (!dto.currentPassword) {
        throw new BadRequestException('Joriy parol majburiy');
      }
      const currentPasswordMatches = await bcrypt.compare(
        dto.currentPassword,
        user.password,
      );
      if (!currentPasswordMatches) {
        throw new BadRequestException("Joriy parol noto'g'ri");
      }
      userData.password = await bcrypt.hash(dto.password, 10);
    }

    const mentorData = Object.fromEntries(
      Object.entries({
        about: dto.about,
        experience: dto.experience,
        telegram: dto.telegram,
        linkedin: dto.linkedin,
      }).filter(([, value]) => value !== undefined),
    );

    await this.prisma.$transaction(async (tx) => {
      const filteredUserData = Object.fromEntries(
        Object.entries(userData).filter(([, value]) => value !== undefined),
      );

      if (Object.keys(filteredUserData).length > 0) {
        await tx.user.update({
          where: { id: userId },
          data: filteredUserData,
        });
      }

      await tx.mentor.upsert({
        where: { userId },
        update: mentorData,
        create: {
          userId,
          about: dto.about,
          experience: dto.experience ?? 0,
          telegram: dto.telegram,
          linkedin: dto.linkedin,
        },
      });
    });

    return this.getProfile(userId);
  }

  async getCourses(userId: number) {
    const courses = await this.prisma.course.findMany({
      where: { mentorId: userId },
      include: {
        ratings: { select: { rate: true } },
        _count: { select: { purchased: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return courses.map((course) => {
      const totalRatings = course.ratings.length;
      const avgRating =
        totalRatings > 0
          ? course.ratings.reduce((sum, r) => sum + r.rate, 0) / totalRatings
          : 0;

      return {
        id: course.id,
        name: course.name,
        price: course.price,
        level: course.level,
        published: course.published,
        studentCount: course._count.purchased,
        averageRating: parseFloat(avgRating.toFixed(1)),
        ratingCount: totalRatings,
      };
    });
  }

  async getCourseStudents(userId: number, courseId: number) {
    const course = await this.prisma.course.findFirst({
      where: { id: courseId, mentorId: userId },
    });

    if (!course) {
      throw new NotFoundException(
        'Kurs topilmadi yoki bu kurs sizga tegishli emas',
      );
    }

    const purchased = await this.prisma.purchasedCourse.findMany({
      where: { courseId },
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            email: true,
            image: true,
            lastActivity: {
              select: { updatedAt: true, url: true },
            },
          },
        },
      },
      orderBy: { purchasedAt: 'desc' },
    });

    // Calculate progress per student (viewed lessons / total lessons)
    const totalLessons = await this.prisma.lesson.count({
      where: { group: { courseId } },
    });

    const result = await Promise.all(
      purchased.map(async (p) => {
        const viewedLessons = await this.prisma.lessonView.count({
          where: {
            userId: p.userId,
            lesson: { group: { courseId } },
            view: true,
          },
        });

        const progress =
          totalLessons > 0
            ? Math.round((viewedLessons / totalLessons) * 100)
            : 0;

        return {
          id: p.user.id,
          fullName: p.user.fullName,
          email: p.user.email,
          image: p.user.image,
          progress,
          lastActivity: p.user.lastActivity?.updatedAt ?? null,
          lastUrl: p.user.lastActivity?.url ?? null,
          purchasedAt: p.purchasedAt,
        };
      }),
    );

    return result;
  }

  async getPendingHomeworks(userId: number) {
    return this.prisma.homeworkSubmission.findMany({
      where: {
        status: HomeworkSubStatus.PENDING,
        homework: {
          lesson: {
            group: {
              OR: [
                { mentorId: userId },
                { mentorAssignments: { some: { mentorId: userId } } },
              ],
            },
          },
        },
      },
      include: {
        user: {
          select: { id: true, fullName: true, email: true, image: true },
        },
        homework: {
          include: {
            lesson: {
              select: {
                id: true,
                name: true,
                group: {
                  select: {
                    id: true,
                    name: true,
                    course: { select: { id: true, name: true } },
                  },
                },
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  async reviewHomework(
    userId: number,
    submissionId: number,
    dto: ReviewHomeworkDto,
  ) {
    const submission = await this.prisma.homeworkSubmission.findFirst({
      where: {
        id: submissionId,
        homework: {
          lesson: {
            group: {
              OR: [
                { mentorId: userId },
                { mentorAssignments: { some: { mentorId: userId } } },
              ],
            },
          },
        },
      },
    });

    if (!submission) {
      throw new NotFoundException(
        'Topshiriq topilmadi yoki bu topshiriq sizning kursингizga tegishli emas',
      );
    }

    if (submission.status !== HomeworkSubStatus.PENDING) {
      throw new BadRequestException('Bu topshiriq allaqachon tekshirilgan');
    }

    const status =
      dto.score < 60 ? HomeworkSubStatus.REJECTED : HomeworkSubStatus.ACCEPTED;
    const comment = dto.comment ?? dto.reason ?? null;

    await this.prisma.homeworkSubmission.update({
      where: { id: submissionId },
      data: {
        status,
        score: dto.score,
        comment,
        reason: comment,
        checkedBy: userId,
        updatedAt: new Date(),
      },
    });

    return {
      status,
      message: `Topshiriq ${status === HomeworkSubStatus.ACCEPTED ? 'qabul qilindi' : 'rad etildi'}`,
    };
  }

  async getQuestions(userId: number, courseId?: number, unread?: string) {
    return this.prisma.question.findMany({
      where: {
        course: { mentorId: userId },
        ...(courseId && { courseId }),
        ...(unread === 'true' && { read: false }),
      },
      include: {
        user: {
          select: { id: true, fullName: true, email: true, image: true },
        },
        course: { select: { id: true, name: true } },
        answer: {
          select: { id: true, text: true, createdAt: true, updatedAt: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async answerQuestion(
    userId: number,
    questionId: number,
    dto: AnswerQuestionDto,
  ) {
    const question = await this.prisma.question.findFirst({
      where: {
        id: questionId,
        course: { mentorId: userId },
      },
    });

    if (!question) {
      throw new NotFoundException(
        'Savol topilmadi yoki bu savol sizning kursингizga tegishli emas',
      );
    }

    await this.prisma.questionAnswer.upsert({
      where: { questionId },
      create: { text: dto.text, questionId, userId },
      update: { text: dto.text, updatedAt: new Date() },
    });

    await this.prisma.question.update({
      where: { id: questionId },
      data: { read: true, readAt: new Date(), updatedAt: new Date() },
    });

    return { message: 'Javob muvaffaqiyatli yuborildi' };
  }

  async getCourseAnalytics(userId: number, courseId: number) {
    const course = await this.prisma.course.findFirst({
      where: { id: courseId, mentorId: userId },
    });

    if (!course) {
      throw new NotFoundException(
        'Kurs topilmadi yoki bu kurs sizga tegishli emas',
      );
    }

    const [
      studentsCount,
      ratings,
      totalLessons,
      completedViews,
      homeworksSubmitted,
      pendingHomeworks,
      unansweredQuestions,
    ] = await Promise.all([
      this.prisma.purchasedCourse.count({ where: { courseId } }),
      this.prisma.rating.findMany({
        where: { courseId },
        select: { rate: true },
      }),
      this.prisma.lesson.count({ where: { group: { courseId } } }),
      this.prisma.lessonView.count({
        where: { lesson: { group: { courseId } }, view: true },
      }),
      this.prisma.homeworkSubmission.count({
        where: { homework: { lesson: { group: { courseId } } } },
      }),
      this.prisma.homeworkSubmission.count({
        where: {
          status: HomeworkSubStatus.PENDING,
          homework: { lesson: { group: { courseId } } },
        },
      }),
      this.prisma.question.count({ where: { courseId, read: false } }),
    ]);

    const averageRating =
      ratings.length > 0
        ? parseFloat(
            (ratings.reduce((s, r) => s + r.rate, 0) / ratings.length).toFixed(
              1,
            ),
          )
        : 0;

    return {
      studentsCount,
      totalLessons,
      completedViews,
      homeworksSubmitted,
      pendingHomeworks,
      averageRating,
      ratingCount: ratings.length,
      unansweredQuestions,
    };
  }
}
