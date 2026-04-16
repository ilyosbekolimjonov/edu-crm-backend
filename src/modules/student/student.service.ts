import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { HomeworkSubStatus, Prisma, UserRole } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../../common/prisma/prisma.service';
import { AttendanceQueryDto } from './dto/attendance-query.dto';
import { CreateStudentSubmissionDto } from './dto/create-student-submission.dto';
import { UpdateStudentProfileDto } from './dto/update-student-profile.dto';

const profileSelect = {
  id: true,
  fullName: true,
  username: true,
  email: true,
  phone: true,
  image: true,
  role: true,
  isActive: true,
  createdAt: true,
} satisfies Prisma.UserSelect;

@Injectable()
export class StudentService {
  constructor(private readonly prisma: PrismaService) {}

  private membershipWhere(userId: number): Prisma.StudentGroupWhereInput {
    return {
      userId,
      status: 'ACTIVE',
      group: { status: 'ACTIVE' },
    };
  }

  private assignedMembershipWhere(
    userId: number,
  ): Prisma.StudentGroupWhereInput {
    return { userId };
  }

  private lessonOwnershipWhere(
    lessonId: string,
    userId: number,
  ): Prisma.LessonWhereInput {
    return {
      id: lessonId,
      group: { studentGroups: { some: this.assignedMembershipWhere(userId) } },
    };
  }

  private async getStudentGroupIds(userId: number) {
    const memberships = await this.prisma.studentGroup.findMany({
      where: this.membershipWhere(userId),
      select: { groupId: true },
    });
    return memberships.map((item) => item.groupId);
  }

  async getDashboard(userId: number) {
    const [profile, groupCount, lessonsCount, watchedLessonsCount] =
      await Promise.all([
        this.getProfile(userId),
        this.prisma.studentGroup.count({ where: this.membershipWhere(userId) }),
        this.prisma.lesson.count({
          where: {
            group: { studentGroups: { some: this.membershipWhere(userId) } },
          },
        }),
        this.prisma.lessonView.count({
          where: {
            userId,
            view: true,
            lesson: {
              group: { studentGroups: { some: this.membershipWhere(userId) } },
            },
          },
        }),
      ]);

    const groupIds = await this.getStudentGroupIds(userId);

    const [homeworkCount, submittedHomeworkCount, attendanceTotal, present] =
      await Promise.all([
        this.prisma.homework.count({
          where: {
            lesson: {
              group: { studentGroups: { some: this.membershipWhere(userId) } },
            },
          },
        }),
        this.prisma.homeworkSubmission.count({
          where: {
            userId,
            homework: {
              lesson: {
                group: {
                  studentGroups: { some: this.membershipWhere(userId) },
                },
              },
            },
          },
        }),
        this.prisma.groupAttendance.count({
          where: { userId, groupId: { in: groupIds } },
        }),
        this.prisma.groupAttendance.count({
          where: { userId, groupId: { in: groupIds }, present: true },
        }),
      ]);

    const absent = Math.max(attendanceTotal - present, 0);

    return {
      profile,
      groupCount,
      lessonsCount,
      watchedLessonsCount,
      homeworkCount,
      submittedHomeworkCount,
      attendanceSummary: {
        total: attendanceTotal,
        present,
        absent,
        percent:
          attendanceTotal > 0
            ? Math.round((present / attendanceTotal) * 100)
            : 0,
      },
    };
  }

  async getGroups(userId: number) {
    const memberships = await this.prisma.studentGroup.findMany({
      where: this.assignedMembershipWhere(userId),
      include: {
        group: {
          include: {
            course: {
              select: {
                id: true,
                name: true,
                level: true,
                durationMinutes: true,
                durationMonths: true,
              },
            },
            mentor: {
              select: {
                id: true,
                fullName: true,
                phone: true,
                email: true,
                image: true,
              },
            },
            room: { select: { id: true, name: true } },
            _count: { select: { lessons: true, studentGroups: true } },
          },
        },
      },
      orderBy: { joinedAt: 'desc' },
    });

    return memberships.map(({ group, joinedAt, status }) => ({
      ...group,
      schedule: {
        startDate: group.startDate,
        startTime: group.startTime,
        durationMinutes: group.durationMinutes,
        weekDays: group.weekDays,
      },
      membership: { joinedAt, status },
    }));
  }

  async getLessons(userId: number) {
    const lessons = await this.prisma.lesson.findMany({
      where: {
        group: {
          studentGroups: { some: this.assignedMembershipWhere(userId) },
        },
      },
      include: {
        group: {
          select: {
            id: true,
            name: true,
            course: { select: { id: true, name: true } },
          },
        },
        homework: { select: { id: true, task: true } },
        files: { select: { id: true, file: true, note: true } },
        views: { where: { userId }, select: { view: true } },
      },
      orderBy: { createdAt: 'asc' },
    });

    return lessons.map(({ views, homework, ...lesson }) => ({
      ...lesson,
      viewed: views[0]?.view ?? false,
      hasHomework: Boolean(homework),
      homework,
    }));
  }

  async getLesson(id: string, userId: number) {
    const lesson = await this.prisma.lesson.findFirst({
      where: this.lessonOwnershipWhere(id, userId),
      include: {
        group: {
          select: {
            id: true,
            name: true,
            course: { select: { id: true, name: true } },
            mentor: { select: { id: true, fullName: true } },
          },
        },
        files: { select: { id: true, file: true, note: true, createdAt: true } },
        homework: {
          select: {
            id: true,
            task: true,
            file: true,
            submissions: {
              where: { userId },
              select: {
                id: true,
                text: true,
                file: true,
                status: true,
                score: true,
                comment: true,
                reason: true,
                createdAt: true,
                updatedAt: true,
                checkedBy: true,
              },
            },
          },
        },
      },
    });

    if (!lesson) throw new NotFoundException('Dars topilmadi');

    await this.prisma.lessonView.upsert({
      where: { lessonId_userId: { lessonId: id, userId } },
      create: { lessonId: id, userId, view: true },
      update: { view: true },
    });

    return { ...lesson, viewed: true };
  }

  async getHomeworks(userId: number) {
    const homeworks = await this.prisma.homework.findMany({
      where: {
        lesson: {
          group: { studentGroups: { some: this.membershipWhere(userId) } },
        },
      },
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
        submissions: {
          where: { userId },
          select: {
            id: true,
            text: true,
            file: true,
            status: true,
            score: true,
            comment: true,
            reason: true,
            createdAt: true,
            updatedAt: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return homeworks.map(({ submissions, ...homework }) => ({
      ...homework,
      submission: submissions[0] ?? null,
      submitted: submissions.length > 0,
      submissionStatus: submissions[0]?.status ?? null,
    }));
  }

  async submitHomework(
    homeworkId: number,
    dto: CreateStudentSubmissionDto,
    userId: number,
    file?: string,
  ) {
    const homework = await this.prisma.homework.findFirst({
      where: {
        id: homeworkId,
        lesson: {
          group: { studentGroups: { some: this.membershipWhere(userId) } },
        },
      },
      select: { id: true },
    });

    if (!homework) throw new NotFoundException('Topshiriq topilmadi');

    const existing = await this.prisma.homeworkSubmission.findFirst({
      where: { homeworkId, userId },
    });
    if (existing)
      throw new ConflictException('Siz bu topshiriqni allaqachon yuborgansiz');

    return this.prisma.homeworkSubmission.create({
      data: {
        homeworkId,
        userId,
        text: dto.text,
        file: file ?? '',
        status: HomeworkSubStatus.PENDING,
      },
      include: {
        homework: {
          select: {
            id: true,
            task: true,
            lesson: { select: { id: true, name: true } },
          },
        },
      },
    });
  }

  async getAttendance(userId: number, query: AttendanceQueryDto) {
    const groupIds = await this.getStudentGroupIds(userId);

    if (query.groupId && !groupIds.includes(query.groupId)) {
      throw new NotFoundException('Guruh topilmadi');
    }

    const where: Prisma.GroupAttendanceWhereInput = {
      userId,
      groupId: query.groupId ?? { in: groupIds },
    };

    const records = await this.prisma.groupAttendance.findMany({
      where,
      include: {
        group: {
          select: {
            id: true,
            name: true,
            course: { select: { id: true, name: true } },
          },
        },
      },
      orderBy: { lessonDate: 'desc' },
    });

    const present = records.filter((item) => item.present).length;
    const total = records.length;

    return {
      summary: {
        total,
        present,
        absent: Math.max(total - present, 0),
        percent: total > 0 ? Math.round((present / total) * 100) : 0,
      },
      records,
    };
  }

  async getProfile(userId: number) {
    const user = await this.prisma.user.findFirst({
      where: { id: userId, role: UserRole.STUDENT },
      select: profileSelect,
    });
    if (!user) throw new NotFoundException('Foydalanuvchi topilmadi');
    return user;
  }

  async updateProfile(
    userId: number,
    dto: UpdateStudentProfileDto,
    image?: string,
  ) {
    const user = await this.prisma.user.findFirst({
      where: { id: userId, role: UserRole.STUDENT },
    });
    if (!user) throw new NotFoundException('Foydalanuvchi topilmadi');

    if (dto.username && dto.username !== user.username) {
      const exists = await this.prisma.user.findUnique({
        where: { username: dto.username },
      });
      if (exists) throw new BadRequestException('Bu username allaqachon band');
    }

    if (dto.phone && dto.phone !== user.phone) {
      const exists = await this.prisma.user.findUnique({
        where: { phone: dto.phone },
      });
      if (exists)
        throw new BadRequestException('Bu telefon raqam allaqachon band');
    }

    const data: Prisma.UserUpdateInput = {
      ...(dto.fullName !== undefined ? { fullName: dto.fullName } : {}),
      ...(dto.username !== undefined ? { username: dto.username } : {}),
      ...(dto.phone !== undefined ? { phone: dto.phone } : {}),
      ...(image !== undefined ? { image } : {}),
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
      data.password = await bcrypt.hash(dto.password, 10);
    }

    return this.prisma.user.update({
      where: { id: userId },
      data,
      select: profileSelect,
    });
  }
}
