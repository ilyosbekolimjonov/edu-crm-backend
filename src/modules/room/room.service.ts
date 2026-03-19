import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CreateRoomDto } from './dto/create-room.dto';
import { UpdateRoomDto } from './dto/update-room.dto';

@Injectable()
export class RoomService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateRoomDto) {
    const exists = await this.prisma.room.findUnique({
      where: { name: dto.name },
    });
    if (exists) throw new ConflictException('Bu nomli xona allaqachon mavjud');
    return this.prisma.room.create({ data: dto });
  }

  async findAll(onlyActive?: boolean) {
    return this.prisma.room.findMany({
      where: onlyActive ? { isActive: true } : undefined,
      include: { _count: { select: { groups: true } } },
      orderBy: { name: 'asc' },
    });
  }

  async findOne(id: number) {
    const room = await this.prisma.room.findUnique({
      where: { id },
      include: {
        groups: {
          where: { status: 'ACTIVE' },
          select: {
            id: true,
            name: true,
            startTime: true,
            weekDays: true,
            _count: { select: { studentGroups: true } },
          },
        },
      },
    });
    if (!room) throw new NotFoundException('Xona topilmadi');
    return room;
  }

  async update(id: number, dto: UpdateRoomDto) {
    await this.findOne(id);
    if (dto.name) {
      const exists = await this.prisma.room.findFirst({
        where: { name: dto.name, NOT: { id } },
      });
      if (exists)
        throw new ConflictException('Bu nomli xona allaqachon mavjud');
    }
    return this.prisma.room.update({ where: { id }, data: dto });
  }

  async remove(id: number) {
    await this.findOne(id);
    const activeGroups = await this.prisma.group.count({
      where: { roomId: id, status: 'ACTIVE' },
    });
    if (activeGroups > 0)
      throw new ConflictException(
        'Xonada faol guruhlar mavjud, avval ularni yoping',
      );
    await this.prisma.room.delete({ where: { id } });
    return { message: "Xona o'chirildi" };
  }
}
