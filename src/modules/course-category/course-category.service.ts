import { ConflictException, Injectable, NotFoundException, } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CreateCourseCategoryDto } from './dto/create-course-category.dto';
import { UpdateCourseCategoryDto } from './dto/update-course-category.dto';

@Injectable()
export class CourseCategoryService {
    constructor(private readonly prisma: PrismaService) { }

    async create(dto: CreateCourseCategoryDto) {
        const exists = await this.prisma.courseCategory.findFirst({
            where: { name: { equals: dto.name, mode: 'insensitive' } },
        });
        if (exists) throw new ConflictException('Bu nomli kategoriya allaqachon mavjud');

        const category = await this.prisma.courseCategory.create({ data: dto });
        return category;
    }

    async findAll() {
        return this.prisma.courseCategory.findMany({
            orderBy: { name: 'asc' },
            include: { _count: { select: { courses: true } } },
        });
    }

    async findOne(id: number) {
        const category = await this.prisma.courseCategory.findUnique({
            where: { id },
            include: {
                courses: {
                    where: { published: true },
                    select: { id: true, name: true, level: true, price: true },
                },
            },
        });
        if (!category) throw new NotFoundException('Kategoriya topilmadi');
        return category;
    }

    async update(id: number, dto: UpdateCourseCategoryDto) {
        await this.findOne(id);

        if (dto.name) {
            const exists = await this.prisma.courseCategory.findFirst({
                where: { name: { equals: dto.name, mode: 'insensitive' }, NOT: { id } },
            });
            if (exists) throw new ConflictException('Bu nomli kategoriya allaqachon mavjud');
        }

        return this.prisma.courseCategory.update({ where: { id }, data: dto });
    }

    async remove(id: number) {
        await this.findOne(id);
        await this.prisma.courseCategory.delete({ where: { id } });
        return { message: 'Kategoriya o\'chirildi' };
    }
}
