import { BadRequestException, ForbiddenException, Injectable, NotFoundException, } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CreateCourseDto } from './dto/create-course.dto';
import { UpdateCourseDto } from './dto/update-course.dto';
import { CourseQueryDto } from './dto/course-query.dto';

@Injectable()
export class CourseService {
    constructor(private readonly prisma: PrismaService) { }

    async create(dto: CreateCourseDto) {
        const mentor = await this.prisma.user.findUnique({ where: { id: dto.mentorId } });
        if (!mentor || mentor.role !== UserRole.MENTOR) {
            throw new BadRequestException('mentorId bo\'yicha foydalanuvchi topilmadi yoki MENTOR rolida emas');
        }

        const category = await this.prisma.courseCategory.findUnique({ where: { id: dto.categoryId } });
        if (!category) throw new NotFoundException('Kategoriya topilmadi');

        const course = await this.prisma.course.create({
            data: {
                name: dto.name,
                about: dto.about,
                price: dto.price,
                banner: dto.banner,
                introVideo: dto.introVideo,
                level: dto.level,
                categoryId: dto.categoryId,
                mentorId: dto.mentorId,
            },
            include: {
                category: { select: { id: true, name: true } },
                mentor: { select: { id: true, fullName: true, email: true } },
            },
        });

        return course;
    }

    async findAll(query: CourseQueryDto) {
        const published = query.published === 'true' ? true
            : query.published === 'false' ? false
                : undefined;

        const courses = await this.prisma.course.findMany({
            where: {
                ...(published !== undefined && { published }),
                ...(query.categoryId && { categoryId: query.categoryId }),
                ...(query.level && { level: query.level }),
                ...(query.mentorId && { mentorId: query.mentorId }),
                ...(query.search && {
                    name: { contains: query.search, mode: 'insensitive' },
                }),
            },
            include: {
                category: { select: { id: true, name: true } },
                mentor: { select: { id: true, fullName: true, image: true } },
                ratings: { select: { rate: true } },
                _count: { select: { purchased: true, groups: true } },
            },
            orderBy: { createdAt: 'desc' },
        });

        return courses.map((c) => {
            const avgRating =
                c.ratings.length > 0
                    ? parseFloat((c.ratings.reduce((s, r) => s + r.rate, 0) / c.ratings.length).toFixed(1))
                    : 0;

            return {
                id: c.id,
                name: c.name,
                about: c.about,
                price: c.price,
                banner: c.banner,
                introVideo: c.introVideo,
                level: c.level,
                published: c.published,
                createdAt: c.createdAt,
                category: c.category,
                mentor: c.mentor,
                studentCount: c._count.purchased,
                groupCount: c._count.groups,
                averageRating: avgRating,
                ratingCount: c.ratings.length,
            };
        });
    }

    async findOne(id: number) {
        const course = await this.prisma.course.findUnique({
            where: { id },
            include: {
                category: true,
                mentor: {
                    select: {
                        id: true,
                        fullName: true,
                        image: true,
                        email: true,
                        Mentor: {
                            select: { telegram: true, linkedin: true },
                        },
                    },
                },
                ratings: {
                    include: { user: { select: { id: true, fullName: true, image: true } } },
                    orderBy: { createdAt: 'desc' },
                    take: 10,
                },
                groups: {
                    select: {
                        id: true,
                        name: true,
                        _count: { select: { lessons: true } },
                    },
                    orderBy: { createdAt: 'asc' },
                },
                _count: { select: { purchased: true } },
            },
        });

        if (!course) throw new NotFoundException('Kurs topilmadi');

        const avgRating =
            course.ratings.length > 0
                ? parseFloat(
                    (course.ratings.reduce((s, r) => s + r.rate, 0) / course.ratings.length).toFixed(1),
                )
                : 0;

        return { ...course, averageRating: avgRating };
    }


    async update(id: number, dto: UpdateCourseDto, currentUserId: number, currentUserRole: UserRole) {
        const course = await this.prisma.course.findUnique({ where: { id } });
        if (!course) throw new NotFoundException('Kurs topilmadi');

        if (currentUserRole === UserRole.MENTOR && course.mentorId !== currentUserId) {
            throw new ForbiddenException('Siz faqat o\'z kursingizni tahrirlashingiz mumkin');
        }

        if (currentUserRole === UserRole.MENTOR && dto.mentorId) {
            throw new ForbiddenException('Mentor kurs egasini o\'zgartira olmaydi');
        }

        if (dto.mentorId) {
            const mentor = await this.prisma.user.findUnique({ where: { id: dto.mentorId } });
            if (!mentor || mentor.role !== UserRole.MENTOR) {
                throw new BadRequestException('mentorId bo\'yicha MENTOR topilmadi');
            }
        }

        if (dto.categoryId) {
            const category = await this.prisma.courseCategory.findUnique({ where: { id: dto.categoryId } });
            if (!category) throw new NotFoundException('Kategoriya topilmadi');
        }

        return this.prisma.course.update({
            where: { id },
            data: { ...dto, updatedAt: new Date() },
            include: {
                category: { select: { id: true, name: true } },
                mentor: { select: { id: true, fullName: true } },
            },
        });
    }

    async togglePublish(id: number, currentUserId: number, currentUserRole: UserRole) {
        const course = await this.prisma.course.findUnique({ where: { id } });
        if (!course) throw new NotFoundException('Kurs topilmadi');

        if (currentUserRole === UserRole.MENTOR && course.mentorId !== currentUserId) {
            throw new ForbiddenException('Siz faqat o\'z kursingizni nashr qilishingiz mumkin');
        }

        const updated = await this.prisma.course.update({
            where: { id },
            data: { published: !course.published, updatedAt: new Date() },
        });

        return {
            message: updated.published ? 'Kurs nashr qilindi' : 'Kurs nashrdan olindi',
            published: updated.published,
        };
    }

    async remove(id: number) {
        const course = await this.prisma.course.findUnique({ where: { id } });
        if (!course) throw new NotFoundException('Kurs topilmadi');

        await this.prisma.course.delete({ where: { id } });
        return { message: 'Kurs o\'chirildi' };
    }
}
