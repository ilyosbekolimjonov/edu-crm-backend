import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CreateLessonDto } from './dto/create-lesson.dto';
import { UpdateLessonDto } from './dto/update-lesson.dto';
import { AddLessonFileDto } from './dto/add-lesson-file.dto';
import type { JwtPayload } from '../../common/types/jwt-payload.type';

@Injectable()
export class LessonService {
  constructor(private readonly prisma: PrismaService) {}

  private async getGroupWithCourse(groupId: number) {
    const group = await this.prisma.group.findUnique({
      where: { id: groupId },
      include: { course: { select: { mentorId: true } } },
    });
    if (!group) throw new NotFoundException('Guruh topilmadi');
    return group;
  }

  private checkMentorOwnership(mentorId: number, user: JwtPayload) {
    if (user.role === UserRole.MENTOR && mentorId !== user.sub) {
      throw new ForbiddenException('Bu kurs sizniki emas');
    }
  }

  async create(dto: CreateLessonDto, user: JwtPayload) {
    const group = await this.getGroupWithCourse(dto.groupId);
    this.checkMentorOwnership(group.course.mentorId, user);

    return this.prisma.lesson.create({
      data: {
        name: dto.name,
        about: dto.about?.trim() || "Tavsif keyin qo'shiladi",
        video: dto.video?.trim() || '-',
        groupId: dto.groupId,
      },
      include: { group: { select: { id: true, name: true } } },
    });
  }

  async findByGroup(lessonGroupId: number, userId: number) {
    await this.getGroupWithCourse(lessonGroupId);
    const lessons = await this.prisma.lesson.findMany({
      where: { groupId: lessonGroupId },
      include: {
        files: { select: { id: true, file: true, note: true } },
        views: { where: { userId }, select: { view: true } },
        homework: { select: { id: true, task: true } },
      },
      orderBy: { createdAt: 'asc' },
    });
    return lessons.map((l) => ({
      ...l,
      viewed: l.views[0]?.view ?? false,
      views: undefined,
    }));
  }

  async findOne(id: string, userId: number) {
    const lesson = await this.prisma.lesson.findUnique({
      where: { id },
      include: {
        group: { select: { id: true, name: true, courseId: true } },
        files: {
          select: { id: true, file: true, note: true, createdAt: true },
        },
        views: { where: { userId }, select: { view: true } },
        homework: { select: { id: true, task: true, file: true } },
      },
    });
    if (!lesson) throw new NotFoundException('Dars topilmadi');
    return {
      ...lesson,
      viewed: lesson.views[0]?.view ?? false,
      views: undefined,
    };
  }

  async update(id: string, dto: UpdateLessonDto, user: JwtPayload) {
    const lesson = await this.prisma.lesson.findUnique({
      where: { id },
      include: {
        group: { include: { course: { select: { mentorId: true } } } },
      },
    });
    if (!lesson) throw new NotFoundException('Dars topilmadi');
    this.checkMentorOwnership(lesson.group.course.mentorId, user);

    return this.prisma.lesson.update({
      where: { id },
      data: { ...dto, updatedAt: new Date() },
    });
  }

  async remove(id: string, user: JwtPayload) {
    const lesson = await this.prisma.lesson.findUnique({
      where: { id },
      include: {
        group: { include: { course: { select: { mentorId: true } } } },
      },
    });
    if (!lesson) throw new NotFoundException('Dars topilmadi');
    this.checkMentorOwnership(lesson.group.course.mentorId, user);

    await this.prisma.lesson.delete({ where: { id } });
    return { message: "Dars o'chirildi" };
  }

  async addFile(id: string, dto: AddLessonFileDto, user: JwtPayload) {
    const lesson = await this.prisma.lesson.findUnique({
      where: { id },
      include: {
        group: { include: { course: { select: { mentorId: true } } } },
      },
    });
    if (!lesson) throw new NotFoundException('Dars topilmadi');
    this.checkMentorOwnership(lesson.group.course.mentorId, user);

    return this.prisma.lessonFile.create({
      data: { file: dto.file, note: dto.note, lessonId: id },
    });
  }

  async removeFile(id: string, fileId: number, user: JwtPayload) {
    const file = await this.prisma.lessonFile.findUnique({
      where: { id: fileId },
      include: {
        lesson: {
          include: {
            group: { include: { course: { select: { mentorId: true } } } },
          },
        },
      },
    });
    if (!file || file.lessonId !== id)
      throw new NotFoundException('Fayl topilmadi');
    this.checkMentorOwnership(file.lesson.group.course.mentorId, user);

    await this.prisma.lessonFile.delete({ where: { id: fileId } });
    return { message: "Fayl o'chirildi" };
  }

  async markViewed(id: string, userId: number) {
    const lesson = await this.prisma.lesson.findUnique({ where: { id } });
    if (!lesson) throw new NotFoundException('Dars topilmadi');

    return this.prisma.lessonView.upsert({
      where: { lessonId_userId: { lessonId: id, userId } },
      create: { lessonId: id, userId, view: true },
      update: { view: true },
    });
  }
}
