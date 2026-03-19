import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CreateHomeworkDto } from './dto/create-homework.dto';
import { UpdateHomeworkDto } from './dto/update-homework.dto';
import type { JwtPayload } from '../../common/types/jwt-payload.type';

@Injectable()
export class HomeworkService {
  constructor(private readonly prisma: PrismaService) {}

  private async getLessonWithCourse(lessonId: string) {
    const lesson = await this.prisma.lesson.findUnique({
      where: { id: lessonId },
      include: {
        group: { include: { course: { select: { mentorId: true } } } },
      },
    });
    if (!lesson) throw new NotFoundException('Dars topilmadi');
    return lesson;
  }

  private async getHomeworkWithCourse(id: number) {
    const hw = await this.prisma.homework.findUnique({
      where: { id },
      include: {
        lesson: {
          include: {
            group: { include: { course: { select: { mentorId: true } } } },
          },
        },
      },
    });
    if (!hw) throw new NotFoundException('Topshiriq topilmadi');
    return hw;
  }

  private checkMentorOwnership(mentorId: number, user: JwtPayload) {
    if (user.role === UserRole.MENTOR && mentorId !== user.sub) {
      throw new ForbiddenException('Bu kurs sizniki emas');
    }
  }

  async create(dto: CreateHomeworkDto, user: JwtPayload) {
    const lesson = await this.getLessonWithCourse(dto.lessonId);
    this.checkMentorOwnership(lesson.group.course.mentorId, user);

    const exists = await this.prisma.homework.findUnique({
      where: { lessonId: dto.lessonId },
    });
    if (exists)
      throw new ConflictException('Bu darsda allaqachon topshiriq mavjud');

    return this.prisma.homework.create({
      data: { task: dto.task, file: dto.file, lessonId: dto.lessonId },
      include: { lesson: { select: { id: true, name: true } } },
    });
  }

  async findByLesson(lessonId: string) {
    const lesson = await this.prisma.lesson.findUnique({
      where: { id: lessonId },
    });
    if (!lesson) throw new NotFoundException('Dars topilmadi');

    const hw = await this.prisma.homework.findUnique({
      where: { lessonId },
      include: {
        lesson: { select: { id: true, name: true } },
        _count: { select: { submissions: true } },
      },
    });
    if (!hw) throw new NotFoundException("Bu darsda hali topshiriq yo'q");
    return hw;
  }

  async update(id: number, dto: UpdateHomeworkDto, user: JwtPayload) {
    const hw = await this.getHomeworkWithCourse(id);
    this.checkMentorOwnership(hw.lesson.group.course.mentorId, user);

    return this.prisma.homework.update({
      where: { id },
      data: { ...dto, updatedAt: new Date() },
    });
  }

  async remove(id: number, user: JwtPayload) {
    const hw = await this.getHomeworkWithCourse(id);
    this.checkMentorOwnership(hw.lesson.group.course.mentorId, user);

    await this.prisma.homework.delete({ where: { id } });
    return { message: "Topshiriq o'chirildi" };
  }
}
