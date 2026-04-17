import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, UserRole } from '@prisma/client';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CreateGroupDto } from './dto/create-group.dto';
import { UpdateGroupDto } from './dto/update-group.dto';
import { GroupQueryDto } from './dto/group-query.dto';
import { AddStudentDto } from './dto/add-student.dto';
import { WeekDays } from '@prisma/client';
import { SetAttendanceDto } from './dto/set-attendance.dto';
import { BulkAttendanceDto } from './dto/bulk-attendance.dto';
import type { JwtPayload } from '../../common/types/jwt-payload.type';

function timeToMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
}

function hasCommonDays(a: WeekDays[], b: WeekDays[]): boolean {
  return a.some((day) => b.includes(day));
}

function hasTimeOverlap(
  startA: number,
  endA: number,
  startB: number,
  endB: number,
): boolean {
  return startA < endB && endA > startB;
}

@Injectable()
export class GroupService {
  constructor(private readonly prisma: PrismaService) {}

  private async assertAttendanceAccess(groupId: number, user?: JwtPayload) {
    const group = await this.prisma.group.findUnique({
      where: { id: groupId },
      include: {
        mentorAssignments: { select: { mentorId: true } },
      },
    });
    if (!group) throw new NotFoundException('Guruh topilmadi');

    if (user?.role === UserRole.MENTOR) {
      const allowed =
        group.mentorId === user.sub ||
        group.mentorAssignments.some((item) => item.mentorId === user.sub);
      if (!allowed) {
        throw new ForbiddenException("Bu guruh davomatiga ruxsatingiz yo'q");
      }
    }

    return group;
  }

  private attendanceDateFromMonthDay(month: string, day: number) {
    const [yearStr, monthStr] = month.split('-');
    const year = Number(yearStr);
    const monthNumber = Number(monthStr);
    const daysInMonth = new Date(Date.UTC(year, monthNumber, 0)).getUTCDate();

    if (
      !Number.isInteger(year) ||
      !Number.isInteger(monthNumber) ||
      monthNumber < 1 ||
      monthNumber > 12 ||
      day < 1 ||
      day > daysInMonth
    ) {
      throw new BadRequestException("Davomat sanasi noto'g'ri");
    }

    return new Date(
      Date.UTC(year, monthNumber - 1, day, 0, 0, 0, 0),
    );
  }

  private async assertStudentAvailability(params: {
    userId: number;
    weekDays: WeekDays[];
    startTime: string;
    durationMinutes: number;
    excludeGroupId?: number;
  }) {
    const { userId, weekDays, startTime, durationMinutes, excludeGroupId } =
      params;
    const candidateStart = timeToMinutes(startTime);
    const candidateEnd = candidateStart + durationMinutes;

    const studentGroups = await this.prisma.studentGroup.findMany({
      where: {
        userId,
        status: 'ACTIVE',
        group: {
          status: 'ACTIVE',
          ...(excludeGroupId ? { id: { not: excludeGroupId } } : {}),
        },
      },
      select: {
        group: {
          select: {
            name: true,
            weekDays: true,
            startTime: true,
            durationMinutes: true,
          },
        },
      },
    });

    for (const item of studentGroups) {
      const existing = item.group;
      if (!hasCommonDays(existing.weekDays, weekDays)) continue;
      const existingStart = timeToMinutes(existing.startTime);
      const existingEnd = existingStart + existing.durationMinutes;
      if (
        hasTimeOverlap(candidateStart, candidateEnd, existingStart, existingEnd)
      ) {
        throw new ConflictException(
          `Talaba vaqtida to'qnashuv bor: ${existing.name}`,
        );
      }
    }
  }

  private async assertScheduleAvailability(params: {
    roomId: number;
    mentorIds: number[];
    weekDays: WeekDays[];
    startTime: string;
    durationMinutes: number;
    excludeGroupId?: number;
  }) {
    const {
      roomId,
      mentorIds,
      weekDays,
      startTime,
      durationMinutes,
      excludeGroupId,
    } = params;
    const candidateStart = timeToMinutes(startTime);
    const candidateEnd = candidateStart + durationMinutes;

    const activeGroups = await this.prisma.group.findMany({
      where: {
        status: 'ACTIVE',
        ...(excludeGroupId ? { NOT: { id: excludeGroupId } } : {}),
        OR: [
          { roomId },
          { mentorId: { in: mentorIds } },
          { mentorAssignments: { some: { mentorId: { in: mentorIds } } } },
        ],
      },
      select: {
        id: true,
        name: true,
        roomId: true,
        mentorId: true,
        weekDays: true,
        startTime: true,
        durationMinutes: true,
        mentorAssignments: { select: { mentorId: true } },
      },
    });

    for (const group of activeGroups) {
      if (!hasCommonDays(group.weekDays, weekDays)) continue;

      const groupStart = timeToMinutes(group.startTime);
      const groupEnd = groupStart + group.durationMinutes;
      if (!hasTimeOverlap(candidateStart, candidateEnd, groupStart, groupEnd))
        continue;

      if (group.roomId === roomId) {
        throw new ConflictException(
          `Xona band: ${group.name} bilan vaqt to'qnashuvi mavjud`,
        );
      }

      const groupMentorIds = new Set([
        group.mentorId,
        ...group.mentorAssignments.map((item) => item.mentorId),
      ]);
      const hasMentorConflict = mentorIds.some((id) => groupMentorIds.has(id));

      if (hasMentorConflict) {
        throw new ConflictException(
          `O'qituvchi band: ${group.name} bilan vaqt to'qnashuvi mavjud`,
        );
      }
    }
  }

  async create(dto: CreateGroupDto) {
    const mentorIds = Array.from(
      new Set([dto.mentorId, ...(dto.mentorIds ?? [])].map(Number)),
    ).filter((id) => Number.isFinite(id));
    const mentors = await this.prisma.user.findMany({
      where: { id: { in: mentorIds } },
      select: { id: true, role: true },
    });
    if (
      mentors.length !== mentorIds.length ||
      mentors.some((m) => m.role !== UserRole.MENTOR)
    ) {
      throw new BadRequestException(
        "mentorId/mentorIds ichida MENTOR bo'lmagan yoki topilmagan user bor",
      );
    }

    const course = await this.prisma.course.findUnique({
      where: { id: dto.courseId },
    });
    if (!course) throw new NotFoundException('Kurs topilmadi');

    const room = await this.prisma.room.findUnique({
      where: { id: dto.roomId },
    });
    if (!room || !room.isActive)
      throw new NotFoundException('Xona topilmadi yoki faol emas');

    const nameExists = await this.prisma.group.findUnique({
      where: { name: dto.name },
    });
    if (nameExists)
      throw new ConflictException('Bu nomli guruh allaqachon mavjud');

    const duration = dto.durationMinutes ?? 90;
    await this.assertScheduleAvailability({
      roomId: dto.roomId,
      mentorIds,
      weekDays: dto.weekDays,
      startTime: dto.startTime,
      durationMinutes: duration,
    });

    const studentIds = Array.from(
      new Set((dto.studentIds ?? []).map(Number)),
    ).filter((id) => Number.isFinite(id));

    if (studentIds.length > room.capacity) {
      throw new ConflictException(
        `Xona sig'imi yetarli emas (sig'im: ${room.capacity})`,
      );
    }

    if (studentIds.length > 0) {
      const students = await this.prisma.user.findMany({
        where: { id: { in: studentIds } },
        select: { id: true, role: true },
      });
      if (
        students.length !== studentIds.length ||
        students.some((s) => s.role !== 'STUDENT')
      ) {
        throw new BadRequestException(
          "studentIds ichida STUDENT bo'lmagan yoki topilmagan user bor",
        );
      }

      for (const studentId of studentIds) {
        await this.assertStudentAvailability({
          userId: studentId,
          weekDays: dto.weekDays,
          startTime: dto.startTime,
          durationMinutes: duration,
        });
      }
    }

    return this.prisma.$transaction(async (tx) => {
      const createdGroup = await tx.group.create({
        data: {
          name: dto.name,
          courseId: dto.courseId,
          mentorId: dto.mentorId,
          roomId: dto.roomId,
          startDate: new Date(dto.startDate),
          startTime: dto.startTime,
          durationMinutes: duration,
          weekDays: dto.weekDays,
        },
      });

      if (studentIds.length > 0) {
        await tx.studentGroup.createMany({
          data: studentIds.map((userId) => ({
            userId,
            groupId: createdGroup.id,
          })),
          skipDuplicates: true,
        });
      }

      if (mentorIds.length > 0) {
        await tx.groupMentor.createMany({
          data: mentorIds.map((mentorId) => ({
            mentorId,
            groupId: createdGroup.id,
          })),
          skipDuplicates: true,
        });
      }

      return tx.group.findUnique({
        where: { id: createdGroup.id },
        include: {
          course: { select: { id: true, name: true } },
          mentor: { select: { id: true, fullName: true } },
          mentorAssignments: {
            include: { mentor: { select: { id: true, fullName: true } } },
          },
          room: { select: { id: true, name: true, capacity: true } },
          _count: { select: { studentGroups: true } },
        },
      });
    });
  }

  async findAll(query: GroupQueryDto, user?: JwtPayload) {
    return this.prisma.group.findMany({
      where: {
        ...(query.status && { status: query.status }),
        ...(query.courseId && { courseId: query.courseId }),
        ...(query.mentorId && { mentorId: query.mentorId }),
        ...(query.roomId && { roomId: query.roomId }),
        ...(user?.role === UserRole.MENTOR
          ? {
              OR: [
                { mentorId: user.sub },
                { mentorAssignments: { some: { mentorId: user.sub } } },
              ],
            }
          : {}),
      },
      include: {
        course: { select: { id: true, name: true } },
        mentor: { select: { id: true, fullName: true } },
        mentorAssignments: {
          include: { mentor: { select: { id: true, fullName: true } } },
        },
        room: { select: { id: true, name: true, capacity: true } },
        studentGroups: {
          include: {
            user: {
              select: {
                id: true,
                role: true,
                isActive: true,
              },
            },
          },
        },
        _count: { select: { studentGroups: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: number, user?: JwtPayload) {
    const group = await this.prisma.group.findUnique({
      where: { id },
      include: {
        course: { select: { id: true, name: true, level: true, price: true } },
        mentor: {
          select: {
            id: true,
            fullName: true,
            Mentor: { select: { telegram: true, linkedin: true } },
          },
        },
        mentorAssignments: {
          include: { mentor: { select: { id: true, fullName: true } } },
        },
        room: { select: { id: true, name: true, capacity: true } },
        studentGroups: {
          include: {
            user: {
              select: { id: true, fullName: true, phone: true, email: true },
            },
          },
        },
      },
    });
    if (!group) throw new NotFoundException('Guruh topilmadi');
    if (user?.role === UserRole.MENTOR) {
      const allowed =
        group.mentor.id === user.sub ||
        group.mentorAssignments.some((item) => item.mentorId === user.sub);
      if (!allowed) {
        throw new ForbiddenException("Bu guruhga ruxsatingiz yo'q");
      }
    }
    return group;
  }

  async update(id: number, dto: UpdateGroupDto) {
    const group = await this.prisma.group.findUnique({ where: { id } });
    if (!group) throw new NotFoundException('Guruh topilmadi');

    const requestedMentorIds = Array.from(
      new Set(
        [...(dto.mentorIds ?? []), ...(dto.mentorId ? [dto.mentorId] : [])].map(
          Number,
        ),
      ),
    ).filter((id) => Number.isFinite(id));

    if (requestedMentorIds.length > 0) {
      const mentors = await this.prisma.user.findMany({
        where: { id: { in: requestedMentorIds } },
        select: { id: true, role: true },
      });
      if (
        mentors.length !== requestedMentorIds.length ||
        mentors.some((m) => m.role !== UserRole.MENTOR)
      ) {
        throw new BadRequestException(
          "mentorId/mentorIds ichida MENTOR bo'lmagan yoki topilmagan user bor",
        );
      }
    }

    if (dto.courseId) {
      const course = await this.prisma.course.findUnique({
        where: { id: dto.courseId },
      });
      if (!course) throw new NotFoundException('Kurs topilmadi');
    }

    if (dto.roomId) {
      const room = await this.prisma.room.findUnique({
        where: { id: dto.roomId },
      });
      if (!room || !room.isActive)
        throw new NotFoundException('Xona topilmadi yoki faol emas');
    }

    if (dto.name && dto.name !== group.name) {
      const exists = await this.prisma.group.findUnique({
        where: { name: dto.name },
      });
      if (exists)
        throw new ConflictException('Bu nomli guruh allaqachon mavjud');
    }

    const existingMentors = await this.prisma.groupMentor.findMany({
      where: { groupId: id },
      select: { mentorId: true },
    });
    const existingMentorIds = existingMentors.map((item) => item.mentorId);
    const nextMentorIds =
      requestedMentorIds.length > 0
        ? requestedMentorIds
        : existingMentorIds.length > 0
          ? existingMentorIds
          : [group.mentorId];
    const nextMentorId = dto.mentorId ?? nextMentorIds[0] ?? group.mentorId;
    const nextRoomId = dto.roomId ?? group.roomId;
    const nextWeekDays = dto.weekDays ?? group.weekDays;
    const nextStartTime = dto.startTime ?? group.startTime;
    const nextDurationMinutes = dto.durationMinutes ?? group.durationMinutes;
    const nextStatus = dto.status ?? group.status;

    if (nextStatus === 'ACTIVE') {
      await this.assertScheduleAvailability({
        roomId: nextRoomId,
        mentorIds: nextMentorIds,
        weekDays: nextWeekDays,
        startTime: nextStartTime,
        durationMinutes: nextDurationMinutes,
        excludeGroupId: id,
      });
    }

    const updated = await this.prisma.group.update({
      where: { id },
      data: {
        ...(dto.name && { name: dto.name }),
        ...(dto.courseId && { courseId: dto.courseId }),
        mentorId: nextMentorId,
        ...(dto.roomId && { roomId: dto.roomId }),
        ...(dto.startDate && { startDate: new Date(dto.startDate) }),
        ...(dto.startTime && { startTime: dto.startTime }),
        ...(dto.durationMinutes && { durationMinutes: dto.durationMinutes }),
        ...(dto.weekDays && { weekDays: dto.weekDays }),
        ...(dto.status && { status: dto.status }),
      },
      include: {
        course: { select: { id: true, name: true, price: true } },
        mentor: { select: { id: true, fullName: true } },
        room: { select: { id: true, name: true, capacity: true } },
      },
    });

    if (requestedMentorIds.length > 0) {
      await this.prisma.groupMentor.deleteMany({ where: { groupId: id } });
      await this.prisma.groupMentor.createMany({
        data: requestedMentorIds.map((mentorId) => ({ mentorId, groupId: id })),
        skipDuplicates: true,
      });
    }

    if (dto.studentIds) {
      const desiredStudentIds = Array.from(
        new Set(dto.studentIds.map(Number)),
      ).filter((n) => Number.isFinite(n));
      const students = await this.prisma.user.findMany({
        where: { id: { in: desiredStudentIds } },
        select: { id: true, role: true },
      });
      if (
        students.length !== desiredStudentIds.length ||
        students.some((s) => s.role !== 'STUDENT')
      ) {
        throw new BadRequestException(
          "studentIds ichida STUDENT bo'lmagan yoki topilmagan user bor",
        );
      }

      const room = await this.prisma.room.findUnique({
        where: { id: updated.roomId },
      });
      if (room && desiredStudentIds.length > room.capacity) {
        throw new ConflictException(
          `Xona sig'imi yetarli emas (sig'im: ${room.capacity})`,
        );
      }

      if (updated.status === 'ACTIVE') {
        for (const studentId of desiredStudentIds) {
          await this.assertStudentAvailability({
            userId: studentId,
            weekDays: updated.weekDays,
            startTime: updated.startTime,
            durationMinutes: updated.durationMinutes,
            excludeGroupId: id,
          });
        }
      }

      const existing = await this.prisma.studentGroup.findMany({
        where: { groupId: id },
        select: { userId: true },
      });
      const existingIds = new Set(existing.map((item) => item.userId));
      const desiredSet = new Set(desiredStudentIds);

      const toRemove = [...existingIds].filter(
        (userId) => !desiredSet.has(userId),
      );
      const toAdd = desiredStudentIds.filter(
        (userId) => !existingIds.has(userId),
      );

      if (toRemove.length > 0) {
        await this.prisma.studentGroup.deleteMany({
          where: { groupId: id, userId: { in: toRemove } },
        });
      }

      if (toAdd.length > 0) {
        await this.prisma.studentGroup.createMany({
          data: toAdd.map((userId) => ({ userId, groupId: id })),
          skipDuplicates: true,
        });
      }
    }

    return this.prisma.group.findUnique({
      where: { id },
      include: {
        course: { select: { id: true, name: true } },
        mentor: { select: { id: true, fullName: true } },
        mentorAssignments: {
          include: { mentor: { select: { id: true, fullName: true } } },
        },
        room: { select: { id: true, name: true, capacity: true } },
        _count: { select: { studentGroups: true } },
      },
    });
  }

  async addStudent(groupId: number, dto: AddStudentDto) {
    const group = await this.prisma.group.findUnique({
      where: { id: groupId },
    });
    if (!group) throw new NotFoundException('Guruh topilmadi');

    const user = await this.prisma.user.findUnique({
      where: { id: dto.userId },
    });
    if (!user) throw new NotFoundException('Foydalanuvchi topilmadi');

    const room = await this.prisma.room.findUnique({
      where: { id: group.roomId },
    });
    const currentCount = await this.prisma.studentGroup.count({
      where: { groupId, status: 'ACTIVE' },
    });
    if (room && currentCount >= room.capacity) {
      throw new ConflictException(
        `Xonada joy qolmadi (sig'im: ${room.capacity})`,
      );
    }

    const alreadyIn = await this.prisma.studentGroup.findUnique({
      where: { userId_groupId: { userId: dto.userId, groupId } },
    });
    if (alreadyIn)
      throw new ConflictException('Talaba bu guruhda allaqachon mavjud');

    if (group.status === 'ACTIVE') {
      await this.assertStudentAvailability({
        userId: dto.userId,
        weekDays: group.weekDays,
        startTime: group.startTime,
        durationMinutes: group.durationMinutes,
        excludeGroupId: groupId,
      });
    }

    return this.prisma.studentGroup.create({
      data: { userId: dto.userId, groupId },
      include: { user: { select: { id: true, fullName: true, phone: true } } },
    });
  }

  async removeStudent(groupId: number, userId: number) {
    const record = await this.prisma.studentGroup.findUnique({
      where: { userId_groupId: { userId, groupId } },
    });
    if (!record) throw new NotFoundException('Talaba bu guruhda topilmadi');
    await this.prisma.studentGroup.delete({
      where: { userId_groupId: { userId, groupId } },
    });
    return { message: 'Talaba guruhdan chiqarildi' };
  }

  async remove(id: number) {
    const group = await this.prisma.group.findUnique({ where: { id } });
    if (!group) throw new NotFoundException('Guruh topilmadi');

    try {
      await this.prisma.$transaction(async (tx) => {
        const lessons = await tx.lesson.findMany({
          where: { groupId: id },
          select: { id: true },
        });
        const lessonIds = lessons.map((lesson) => lesson.id);

        await tx.lastActivity.updateMany({
          where: { groupId: id },
          data: { groupId: null },
        });

        if (lessonIds.length > 0) {
          await tx.lastActivity.updateMany({
            where: { lessonId: { in: lessonIds } },
            data: { lessonId: null },
          });
          await tx.lesson.deleteMany({ where: { id: { in: lessonIds } } });
        }

        await tx.examResult.deleteMany({ where: { lessonGroupId: id } });
        await tx.exam.deleteMany({ where: { lessonGroupId: id } });
        await tx.groupAttendance.deleteMany({ where: { groupId: id } });
        await tx.groupMentor.deleteMany({ where: { groupId: id } });
        await tx.studentGroup.deleteMany({ where: { groupId: id } });

        const result = await tx.group.deleteMany({ where: { id } });
        if (result.count === 0) {
          throw new NotFoundException('Guruh topilmadi');
        }
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2003') {
          throw new ConflictException(
            "Guruhga bog'langan ma'lumotlar bor, avval ularni ajrating",
          );
        }
        if (error.code === 'P2025') {
          throw new NotFoundException('Guruh topilmadi');
        }
      }
      throw error;
    }

    return { message: "Guruh o'chirildi" };
  }

  async getAttendance(groupId: number, month?: string, user?: JwtPayload) {
    await this.assertAttendanceAccess(groupId, user);
    const group = await this.prisma.group.findUnique({
      where: { id: groupId },
      include: {
        course: { select: { id: true, name: true, price: true } },
        mentor: { select: { id: true, fullName: true } },
        mentorAssignments: {
          include: { mentor: { select: { id: true, fullName: true } } },
        },
        room: { select: { id: true, name: true } },
        studentGroups: {
          where: { status: 'ACTIVE' },
          include: {
            user: { select: { id: true, fullName: true, phone: true } },
          },
        },
      },
    });
    if (!group) throw new NotFoundException('Guruh topilmadi');

    const now = new Date();
    const monthValue =
      month && /^\d{4}-\d{2}$/.test(month)
        ? month
        : `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

    const [yearStr, monthStr] = monthValue.split('-');
    const year = Number(yearStr);
    const monthIndex = Number(monthStr) - 1;
    const from = new Date(year, monthIndex, 1);
    const to = new Date(year, monthIndex + 1, 1);
    const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();

    const records = await this.prisma.groupAttendance.findMany({
      where: {
        groupId,
        lessonDate: { gte: from, lt: to },
      },
      select: { userId: true, lessonDate: true, present: true },
    });

    return {
      month: monthValue,
      daysInMonth,
      group: {
        id: group.id,
        name: group.name,
        course: group.course,
        mentor: group.mentor,
        mentorAssignments: group.mentorAssignments,
        room: group.room,
        startTime: group.startTime,
        durationMinutes: group.durationMinutes,
        weekDays: group.weekDays,
      },
      students: group.studentGroups.map((item) => item.user),
      records,
    };
  }

  async bulkSaveAttendance(
    groupId: number,
    dto: BulkAttendanceDto,
    user?: JwtPayload,
  ) {
    await this.assertAttendanceAccess(groupId, user);

    const studentIds = Array.from(
      new Set(dto.changes.map((change) => change.studentId)),
    );
    const memberships = await this.prisma.studentGroup.findMany({
      where: { groupId, userId: { in: studentIds } },
      select: { userId: true },
    });
    const memberIds = new Set(memberships.map((item) => item.userId));
    const invalidStudent = studentIds.find((id) => !memberIds.has(id));
    if (invalidStudent) {
      throw new NotFoundException('Talaba bu guruhga biriktirilmagan');
    }

    await this.prisma.$transaction(async (tx) => {
      for (const change of dto.changes) {
        const lessonDate = this.attendanceDateFromMonthDay(
          dto.month,
          change.day,
        );
        const where = {
          groupId_userId_lessonDate: {
            groupId,
            userId: change.studentId,
            lessonDate,
          },
        };

        if (change.present === null) {
          await tx.groupAttendance.deleteMany({
            where: { groupId, userId: change.studentId, lessonDate },
          });
          continue;
        }

        await tx.groupAttendance.upsert({
          where,
          create: {
            groupId,
            userId: change.studentId,
            lessonDate,
            present: change.present,
          },
          update: { present: change.present },
        });
      }
    });

    return {
      message: 'Davomat saqlandi',
      saved: dto.changes.length,
    };
  }

  async setAttendance(groupId: number, dto: SetAttendanceDto, user?: JwtPayload) {
    await this.assertAttendanceAccess(groupId, user);

    const membership = await this.prisma.studentGroup.findUnique({
      where: { userId_groupId: { userId: dto.userId, groupId } },
    });
    if (!membership)
      throw new NotFoundException('Talaba bu guruhga biriktirilmagan');

    const lessonDate = new Date(dto.date);
    if (Number.isNaN(lessonDate.getTime())) {
      throw new BadRequestException("Sana formati noto'g'ri");
    }

    return this.prisma.groupAttendance.upsert({
      where: {
        groupId_userId_lessonDate: {
          groupId,
          userId: dto.userId,
          lessonDate,
        },
      },
      create: {
        groupId,
        userId: dto.userId,
        lessonDate,
        present: dto.present,
      },
      update: { present: dto.present },
    });
  }

  async removeAttendance(
    groupId: number,
    userId: number,
    date: string,
    user?: JwtPayload,
  ) {
    await this.assertAttendanceAccess(groupId, user);

    const lessonDate = new Date(date);
    if (Number.isNaN(lessonDate.getTime())) {
      throw new BadRequestException("Sana formati noto'g'ri");
    }

    const record = await this.prisma.groupAttendance.findUnique({
      where: {
        groupId_userId_lessonDate: {
          groupId,
          userId,
          lessonDate,
        },
      },
    });

    if (!record) {
      return { message: 'Davomat yozuvi topilmadi' };
    }

    await this.prisma.groupAttendance.delete({
      where: {
        groupId_userId_lessonDate: {
          groupId,
          userId,
          lessonDate,
        },
      },
    });

    return { message: "Davomat yozuvi o'chirildi" };
  }
}
