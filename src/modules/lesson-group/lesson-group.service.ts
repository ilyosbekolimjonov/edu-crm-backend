import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CreateLessonGroupDto } from './dto/create-lesson-group.dto';
import { UpdateLessonGroupDto } from './dto/update-lesson-group.dto';
import type { JwtPayload } from '../../common/types/jwt-payload.type';

@Injectable()
export class LessonGroupService {
    constructor(private readonly prisma: PrismaService) { }

    async create(dto: CreateLessonGroupDto, user: JwtPayload) {
        const course = await this.prisma.course.findUnique({ where: { id: dto.courseId } });
        if (!course) throw new NotFoundException('Kurs topilmadi');

        if (user.role === UserRole.MENTOR && course.mentorId !== user.sub) {
            throw new ForbiddenException('Bu kurs sizniki emas');
        }

        return this.prisma.lessonGroup.create({
            data: { name: dto.name, courseId: dto.courseId },
            include: { course: { select: { id: true, name: true } }, _count: { select: { lessons: true } } },
        });
    }

    async findByCourse(courseId: number) {
        const course = await this.prisma.course.findUnique({ where: { id: courseId } });
        if (!course) throw new NotFoundException('Kurs topilmadi');
        return this.prisma.lessonGroup.findMany({
            where: { courseId },
            include: { _count: { select: { lessons: true } } },
            orderBy: { createdAt: 'asc' },
        });
    }

    async findOne(id: number) {
        const group = await this.prisma.lessonGroup.findUnique({
            where: { id },
            include: {
                course: { select: { id: true, name: true } },
                lessons: { orderBy: { createdAt: 'asc' }, select: { id: true, name: true, about: true, createdAt: true } },
                _count: { select: { lessons: true } },
            },
        });
        if (!group) throw new NotFoundException('Bo\'lim topilmadi');
        return group;
    }

    async update(id: number, dto: UpdateLessonGroupDto, user: JwtPayload) {
        const group = await this.prisma.lessonGroup.findUnique({
            where: { id },
            include: { course: { select: { mentorId: true } } },
        });
        if (!group) throw new NotFoundException('Bo\'lim topilmadi');

        if (user.role === UserRole.MENTOR && group.course.mentorId !== user.sub) {
            throw new ForbiddenException('Bu kurs sizniki emas');
        }

        return this.prisma.lessonGroup.update({ where: { id }, data: dto });
    }

    async remove(id: number, user: JwtPayload) {
        const group = await this.prisma.lessonGroup.findUnique({
            where: { id },
            include: { course: { select: { mentorId: true } } },
        });
        if (!group) throw new NotFoundException('Bo\'lim topilmadi');

        if (user.role === UserRole.MENTOR && group.course.mentorId !== user.sub) {
            throw new ForbiddenException('Bu kurs sizniki emas');
        }

        await this.prisma.lessonGroup.delete({ where: { id } });
        return { message: 'Bo\'lim o\'chirildi' };
    }
}
