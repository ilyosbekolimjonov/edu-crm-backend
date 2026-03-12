import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CreatePurchasedCourseDto } from './dto/create-purchased-course.dto';
import { UpdatePurchasedCourseDto } from './dto/update-purchased-course.dto';
import { PurchasedCourseQueryDto } from './dto/purchased-course-query.dto';

@Injectable()
export class PurchasedCourseService {
    constructor(private readonly prisma: PrismaService) {}

    async create(dto: CreatePurchasedCourseDto) {
        const exists = await this.prisma.purchasedCourse.findUnique({
            where: { userId_courseId: { userId: dto.userId, courseId: dto.courseId } },
        });
        if (exists) throw new ConflictException('Bu foydalanuvchi ushbu kursni allaqachon sotib olgan');

        const user = await this.prisma.user.findUnique({ where: { id: dto.userId } });
        if (!user) throw new NotFoundException('Foydalanuvchi topilmadi');

        const course = await this.prisma.course.findUnique({ where: { id: dto.courseId } });
        if (!course) throw new NotFoundException('Kurs topilmadi');

        if (dto.mentorId) {
            const mentor = await this.prisma.mentor.findUnique({ where: { id: dto.mentorId } });
            if (!mentor) throw new NotFoundException('Mentor topilmadi');
        }

        return this.prisma.purchasedCourse.create({
            data: {
                userId: dto.userId,
                courseId: dto.courseId,
                amount: dto.amount,
                paidVia: dto.paidVia,
                mentorId: dto.mentorId,
            },
            include: {
                user: { select: { id: true, fullName: true, email: true, phone: true } },
                course: { select: { id: true, name: true, price: true } },
                mentor: { select: { id: true, user: { select: { fullName: true } } } },
            },
        });
    }

    async findAll(query: PurchasedCourseQueryDto) {
        return this.prisma.purchasedCourse.findMany({
            where: {
                ...(query.userId && { userId: query.userId }),
                ...(query.courseId && { courseId: query.courseId }),
                ...(query.paidVia && { paidVia: query.paidVia }),
            },
            include: {
                user: { select: { id: true, fullName: true, email: true, phone: true } },
                course: { select: { id: true, name: true, price: true } },
                mentor: { select: { id: true, user: { select: { fullName: true } } } },
            },
            orderBy: { purchasedAt: 'desc' },
        });
    }

    async findMy(userId: number) {
        return this.prisma.purchasedCourse.findMany({
            where: { userId },
            include: {
                course: {
                    select: {
                        id: true, name: true, about: true, banner: true, price: true, level: true,
                        category: { select: { id: true, name: true } },
                        mentor: { select: { fullName: true, Mentor: { select: { about: true, job: true } } } },
                    },
                },
                mentor: { select: { id: true, user: { select: { fullName: true } } } },
            },
            orderBy: { purchasedAt: 'desc' },
        });
    }

    async findOne(userId: number, courseId: number) {
        const record = await this.prisma.purchasedCourse.findUnique({
            where: { userId_courseId: { userId, courseId } },
            include: {
                user: { select: { id: true, fullName: true, email: true, phone: true } },
                course: { select: { id: true, name: true, price: true, level: true } },
                mentor: { select: { id: true, user: { select: { fullName: true } } } },
            },
        });
        if (!record) throw new NotFoundException('Yozuv topilmadi');
        return record;
    }

    async update(userId: number, courseId: number, dto: UpdatePurchasedCourseDto) {
        await this.findOne(userId, courseId);

        if (dto.mentorId) {
            const mentor = await this.prisma.mentor.findUnique({ where: { id: dto.mentorId } });
            if (!mentor) throw new NotFoundException('Mentor topilmadi');
        }

        return this.prisma.purchasedCourse.update({
            where: { userId_courseId: { userId, courseId } },
            data: {
                ...(dto.amount !== undefined && { amount: dto.amount }),
                ...(dto.paidVia && { paidVia: dto.paidVia }),
                ...(dto.mentorId !== undefined && { mentorId: dto.mentorId }),
            },
            include: {
                user: { select: { id: true, fullName: true, email: true } },
                course: { select: { id: true, name: true, price: true } },
                mentor: { select: { id: true, user: { select: { fullName: true } } } },
            },
        });
    }

    async remove(userId: number, courseId: number) {
        await this.findOne(userId, courseId);
        await this.prisma.purchasedCourse.delete({
            where: { userId_courseId: { userId, courseId } },
        });
        return { message: 'Yozuv o\'chirildi' };
    }
}
