import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CreateGroupDto } from './dto/create-group.dto';
import { UpdateGroupDto } from './dto/update-group.dto';
import { GroupQueryDto } from './dto/group-query.dto';
import { AddStudentDto } from './dto/add-student.dto';

function timeToMinutes(time: string): number {
    const [h, m] = time.split(':').map(Number);
    return h * 60 + m;
}

@Injectable()
export class GroupService {
    constructor(private readonly prisma: PrismaService) { }

    async create(dto: CreateGroupDto) {
        const mentor = await this.prisma.user.findUnique({ where: { id: dto.mentorId } });
        if (!mentor || mentor.role !== UserRole.MENTOR) {
            throw new BadRequestException('mentorId bo\'yicha foydalanuvchi topilmadi yoki MENTOR rolida emas');
        }

        const course = await this.prisma.course.findUnique({ where: { id: dto.courseId } });
        if (!course) throw new NotFoundException('Kurs topilmadi');

        const room = await this.prisma.room.findUnique({ where: { id: dto.roomId } });
        if (!room || !room.isActive) throw new NotFoundException('Xona topilmadi yoki faol emas');

        const nameExists = await this.prisma.group.findUnique({ where: { name: dto.name } });
        if (nameExists) throw new ConflictException('Bu nomli guruh allaqachon mavjud');

        const duration = dto.durationMinutes ?? 90;
        const newStart = timeToMinutes(dto.startTime);
        const newEnd = newStart + duration;

        const roomGroups = await this.prisma.group.findMany({
            where: { roomId: dto.roomId, status: 'ACTIVE' },
            select: { startTime: true, durationMinutes: true, weekDays: true },
        });

        const conflict = roomGroups.some(g => {
            const hasCommonDay = g.weekDays.some(d => dto.weekDays.includes(d));
            if (!hasCommonDay) return false;
            const gStart = timeToMinutes(g.startTime);
            const gEnd = gStart + g.durationMinutes;
            return newStart < gEnd && newEnd > gStart;
        });

        if (conflict) throw new ConflictException('Bu vaqtda xona band — boshqa vaqt yoki xona tanlang');

        return this.prisma.group.create({
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
            include: {
                course: { select: { id: true, name: true } },
                mentor: { select: { id: true, fullName: true } },
                room: { select: { id: true, name: true, capacity: true } },
            },
        });
    }

    async findAll(query: GroupQueryDto) {
        return this.prisma.group.findMany({
            where: {
                ...(query.status && { status: query.status }),
                ...(query.courseId && { courseId: query.courseId }),
                ...(query.mentorId && { mentorId: query.mentorId }),
                ...(query.roomId && { roomId: query.roomId }),
            },
            include: {
                course: { select: { id: true, name: true } },
                mentor: { select: { id: true, fullName: true } },
                room: { select: { id: true, name: true, capacity: true } },
                _count: { select: { studentGroups: true } },
            },
            orderBy: { createdAt: 'desc' },
        });
    }

    async findOne(id: number) {
        const group = await this.prisma.group.findUnique({
            where: { id },
            include: {
                course: { select: { id: true, name: true, level: true } },
                mentor: { select: { id: true, fullName: true, Mentor: { select: { about: true, job: true } } } },
                room: { select: { id: true, name: true, capacity: true } },
                studentGroups: {
                    include: { user: { select: { id: true, fullName: true, phone: true, email: true } } },
                },
            },
        });
        if (!group) throw new NotFoundException('Guruh topilmadi');
        return group;
    }

    async update(id: number, dto: UpdateGroupDto) {
        const group = await this.prisma.group.findUnique({ where: { id } });
        if (!group) throw new NotFoundException('Guruh topilmadi');

        if (dto.mentorId) {
            const mentor = await this.prisma.user.findUnique({ where: { id: dto.mentorId } });
            if (!mentor || mentor.role !== UserRole.MENTOR) {
                throw new BadRequestException('mentorId bo\'yicha MENTOR topilmadi');
            }
        }

        if (dto.roomId) {
            const room = await this.prisma.room.findUnique({ where: { id: dto.roomId } });
            if (!room || !room.isActive) throw new NotFoundException('Xona topilmadi yoki faol emas');
        }

        if (dto.name && dto.name !== group.name) {
            const exists = await this.prisma.group.findUnique({ where: { name: dto.name } });
            if (exists) throw new ConflictException('Bu nomli guruh allaqachon mavjud');
        }

        return this.prisma.group.update({
            where: { id },
            data: {
                ...(dto.name && { name: dto.name }),
                ...(dto.mentorId && { mentorId: dto.mentorId }),
                ...(dto.roomId && { roomId: dto.roomId }),
                ...(dto.startDate && { startDate: new Date(dto.startDate) }),
                ...(dto.startTime && { startTime: dto.startTime }),
                ...(dto.durationMinutes && { durationMinutes: dto.durationMinutes }),
                ...(dto.weekDays && { weekDays: dto.weekDays }),
                ...(dto.status && { status: dto.status }),
            },
            include: {
                course: { select: { id: true, name: true } },
                mentor: { select: { id: true, fullName: true } },
                room: { select: { id: true, name: true, capacity: true } },
            },
        });
    }

    async addStudent(groupId: number, dto: AddStudentDto) {
        const group = await this.prisma.group.findUnique({ where: { id: groupId } });
        if (!group) throw new NotFoundException('Guruh topilmadi');

        const user = await this.prisma.user.findUnique({ where: { id: dto.userId } });
        if (!user) throw new NotFoundException('Foydalanuvchi topilmadi');

        const room = await this.prisma.room.findUnique({ where: { id: group.roomId } });
        const currentCount = await this.prisma.studentGroup.count({ where: { groupId, status: 'ACTIVE' } });
        if (room && currentCount >= room.capacity) {
            throw new ConflictException(`Xonada joy qolmadi (sig\'im: ${room.capacity})`);
        }

        const alreadyIn = await this.prisma.studentGroup.findUnique({
            where: { userId_groupId: { userId: dto.userId, groupId } },
        });
        if (alreadyIn) throw new ConflictException('Talaba bu guruhda allaqachon mavjud');

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
        await this.prisma.studentGroup.delete({ where: { userId_groupId: { userId, groupId } } });
        return { message: 'Talaba guruhdan chiqarildi' };
    }

    async remove(id: number) {
        const group = await this.prisma.group.findUnique({ where: { id } });
        if (!group) throw new NotFoundException('Guruh topilmadi');
        await this.prisma.group.delete({ where: { id } });
        return { message: 'Guruh o\'chirildi' };
    }
}
