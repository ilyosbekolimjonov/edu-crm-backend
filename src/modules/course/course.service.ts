import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CreateCourseDto } from './dto/create-course.dto';
import { UpdateCourseDto } from './dto/update-course.dto';
import { CourseQueryDto } from './dto/course-query.dto';

@Injectable()
export class CourseService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateCourseDto) {
    const existingCourse = await this.prisma.course.findFirst({
      where: { name: { equals: dto.name, mode: 'insensitive' } },
    });
    if (existingCourse) {
      throw new BadRequestException('Bu nomli kurs allaqachon mavjud');
    }

    const mentor = await this.prisma.user.findUnique({
      where: { id: dto.mentorId },
    });
    if (!mentor || mentor.role !== UserRole.MENTOR) {
      throw new BadRequestException(
        "mentorId bo'yicha foydalanuvchi topilmadi yoki MENTOR rolida emas",
      );
    }

    const course = await this.prisma.course.create({
      data: {
        name: dto.name,
        about: dto.about,
        durationMinutes: dto.durationMinutes,
        durationMonths: dto.durationMonths,
        price: dto.price,
        introVideo: dto.introVideo,
        level: dto.level,
        mentorId: dto.mentorId,
      },
      include: {
        mentor: { select: { id: true, fullName: true, email: true } },
      },
    });

    return course;
  }

  async findAll(query: CourseQueryDto) {
    const published =
      query.published === 'true'
        ? true
        : query.published === 'false'
          ? false
          : undefined;

    const courses = await this.prisma.course.findMany({
      where: {
        ...(published !== undefined && { published }),
        ...(query.level && { level: query.level }),
        ...(query.mentorId && { mentorId: query.mentorId }),
        ...(query.search && {
          name: { contains: query.search, mode: 'insensitive' },
        }),
      },
      include: {
        mentor: { select: { id: true, fullName: true, image: true } },
        ratings: { select: { rate: true } },
        _count: { select: { purchased: true, classGroups: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return courses.map((c) => {
      const avgRating =
        c.ratings.length > 0
          ? parseFloat(
              (
                c.ratings.reduce((s, r) => s + r.rate, 0) / c.ratings.length
              ).toFixed(1),
            )
          : 0;

      return {
        id: c.id,
        name: c.name,
        about: c.about,
        durationMinutes: c.durationMinutes,
        durationMonths: c.durationMonths,
        price: c.price,
        introVideo: c.introVideo,
        level: c.level,
        published: c.published,
        createdAt: c.createdAt,
        mentor: c.mentor,
        studentCount: c._count.purchased,
        groupCount: c._count.classGroups,
        averageRating: avgRating,
        ratingCount: c.ratings.length,
      };
    });
  }

  async findOne(id: number) {
    const course = await this.prisma.course.findUnique({
      where: { id },
      include: {
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
          include: {
            user: { select: { id: true, fullName: true, image: true } },
          },
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
        classGroups: {
          select: {
            id: true,
            name: true,
            _count: { select: { studentGroups: true, lessons: true } },
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
            (
              course.ratings.reduce((s, r) => s + r.rate, 0) /
              course.ratings.length
            ).toFixed(1),
          )
        : 0;

    return { ...course, groups: course.classGroups, averageRating: avgRating };
  }

  async update(
    id: number,
    dto: UpdateCourseDto,
    currentUserId: number,
    currentUserRole: UserRole,
  ) {
    const course = await this.prisma.course.findUnique({ where: { id } });
    if (!course) throw new NotFoundException('Kurs topilmadi');

    if (
      currentUserRole === UserRole.MENTOR &&
      course.mentorId !== currentUserId
    ) {
      throw new ForbiddenException(
        "Siz faqat o'z kursingizni tahrirlashingiz mumkin",
      );
    }

    if (currentUserRole === UserRole.MENTOR && dto.mentorId) {
      throw new ForbiddenException("Mentor kurs egasini o'zgartira olmaydi");
    }

    if (dto.mentorId) {
      const mentor = await this.prisma.user.findUnique({
        where: { id: dto.mentorId },
      });
      if (!mentor || mentor.role !== UserRole.MENTOR) {
        throw new BadRequestException("mentorId bo'yicha MENTOR topilmadi");
      }
    }

    if (dto.name) {
      const existingCourse = await this.prisma.course.findFirst({
        where: {
          name: { equals: dto.name, mode: 'insensitive' },
          NOT: { id },
        },
      });
      if (existingCourse) {
        throw new BadRequestException('Bu nomli kurs allaqachon mavjud');
      }
    }

    return this.prisma.course.update({
      where: { id },
      data: { ...dto, updatedAt: new Date() },
      include: {
        mentor: { select: { id: true, fullName: true } },
      },
    });
  }

  async togglePublish(
    id: number,
    currentUserId: number,
    currentUserRole: UserRole,
  ) {
    const course = await this.prisma.course.findUnique({ where: { id } });
    if (!course) throw new NotFoundException('Kurs topilmadi');

    if (
      currentUserRole === UserRole.MENTOR &&
      course.mentorId !== currentUserId
    ) {
      throw new ForbiddenException(
        "Siz faqat o'z kursingizni nashr qilishingiz mumkin",
      );
    }

    const updated = await this.prisma.course.update({
      where: { id },
      data: { published: !course.published, updatedAt: new Date() },
    });

    return {
      message: updated.published
        ? 'Kurs nashr qilindi'
        : 'Kurs nashrdan olindi',
      published: updated.published,
    };
  }

  async remove(id: number) {
    const course = await this.prisma.course.findUnique({ where: { id } });
    if (!course) throw new NotFoundException('Kurs topilmadi');

    await this.prisma.course.delete({ where: { id } });
    return { message: "Kurs o'chirildi" };
  }
}
