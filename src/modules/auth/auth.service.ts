import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Prisma, UserRole } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { randomBytes } from 'crypto';
import { PrismaService } from '../../common/prisma/prisma.service';
import { MailService } from '../../common/mail/mail.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { JwtPayload } from '../../common/types/jwt-payload.type';
import { UpdateUserDto } from './dto/update-user.dto';
import { UpdateAdminProfileDto } from './dto/update-profile.dto';

export type Tokens = {
  accessToken: string;
  refreshToken: string;
};

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly mailService: MailService,
  ) {}

  async register(
    dto: RegisterDto,
    creatorRole: UserRole,
  ): Promise<{ message: string; userId: number }> {
    const allowedCreators: UserRole[] = [UserRole.SUPERADMIN, UserRole.ADMIN];
    if (!allowedCreators.includes(creatorRole)) {
      throw new ForbiddenException(
        'Faqat ADMIN yoki SUPERADMIN yangi foydalanuvchi yarata oladi',
      );
    }

    if (creatorRole === UserRole.ADMIN && dto.role === UserRole.SUPERADMIN) {
      throw new ForbiddenException('ADMIN SUPERADMIN yarata olmaydi');
    }

    const existingUser = await this.prisma.user.findFirst({
      where: {
        OR: [
          { email: dto.email },
          { username: dto.username },
          { phone: dto.phone },
        ],
      },
    });
    if (existingUser) {
      throw new BadRequestException(
        'Bu email, username yoki telefon raqam allaqachon band',
      );
    }

    const hashedPassword = await bcrypt.hash(dto.password, 10);
    const verificationToken = randomBytes(32).toString('hex');

    const userRole = dto.role ?? UserRole.STUDENT;

    const user = await this.prisma.user.create({
      data: {
        fullName: dto.fullName,
        username: dto.username,
        email: dto.email,
        phone: dto.phone,
        image: dto.image,
        password: hashedPassword,
        role: userRole,
        isActive: false,
        emailVerificationToken: verificationToken,
        ...(userRole === UserRole.MENTOR
          ? {
              Mentor: {
                create: {
                  about: dto.about,
                  experience: dto.experience ?? 0,
                  telegram: dto.telegram,
                  linkedin: dto.linkedin,
                },
              },
            }
          : {}),
      },
    });

    try {
      await this.mailService.sendVerificationEmail(
        user.email,
        verificationToken,
      );
    } catch {
      await this.prisma.user.delete({ where: { id: user.id } });
      throw new InternalServerErrorException(
        "Tasdiqlash emailini yuborib bo'lmadi. Foydalanuvchi yaratilmadi",
      );
    }

    return {
      message: `Foydalanuvchi yaratildi. Tasdiqlash linki ${user.email} ga yuborildi`,
      userId: user.id,
    };
  }

  async login(dto: LoginDto): Promise<Tokens> {
    const user = await this.prisma.user.findFirst({
      where: {
        OR: [
          { email: dto.login },
          { username: dto.login },
          { phone: dto.login },
        ],
      },
    });

    if (!user) {
      throw new UnauthorizedException("Email yoki username noto'g'ri");
    }

    const passwordMatch = await bcrypt.compare(dto.password, user.password);
    if (!passwordMatch) {
      throw new UnauthorizedException("Parol noto'g'ri");
    }

    if (!user.isActive) {
      throw new ForbiddenException(
        'Hisobingiz faollashtiriilmagan. Email manzilingizni tasdiqlang',
      );
    }

    const tokens = await this.generateTokens(
      user.id,
      user.email,
      user.username,
      user.role,
    );
    await this.updateRefreshToken(user.id, tokens.refreshToken);
    return tokens;
  }

  async getUsers(role?: UserRole) {
    return this.prisma.user.findMany({
      where: role ? { role } : undefined,
      select: {
        id: true,
        fullName: true,
        username: true,
        email: true,
        phone: true,
        image: true,
        role: true,
        isActive: true,
        createdAt: true,
        Mentor: {
          select: {
            about: true,
            experience: true,
            telegram: true,
            linkedin: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getProfile(userId: number) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        fullName: true,
        username: true,
        email: true,
        phone: true,
        image: true,
        role: true,
        isActive: true,
        createdAt: true,
      },
    });
    if (!user) throw new NotFoundException('Foydalanuvchi topilmadi');
    return user;
  }

  async updateProfile(
    userId: number,
    dto: UpdateAdminProfileDto,
    image?: string,
  ) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('Foydalanuvchi topilmadi');

    if (dto.username && dto.username !== user.username) {
      const usernameExists = await this.prisma.user.findUnique({
        where: { username: dto.username },
      });
      if (usernameExists) {
        throw new BadRequestException('Bu username allaqachon band');
      }
    }

    if (dto.phone && dto.phone !== user.phone) {
      const phoneExists = await this.prisma.user.findUnique({
        where: { phone: dto.phone },
      });
      if (phoneExists) {
        throw new BadRequestException('Bu telefon raqam allaqachon band');
      }
    }

    const data: Record<string, unknown> = {
      fullName: dto.fullName,
      username: dto.username,
      phone: dto.phone,
      image,
    };

    if (dto.password) {
      if (!dto.currentPassword) {
        throw new BadRequestException('Joriy parol majburiy');
      }
      const currentPasswordMatches = await bcrypt.compare(
        dto.currentPassword,
        user.password,
      );
      if (!currentPasswordMatches) {
        throw new BadRequestException("Joriy parol noto'g'ri");
      }
      data.password = await bcrypt.hash(dto.password, 10);
    }

    return this.prisma.user.update({
      where: { id: userId },
      data: Object.fromEntries(
        Object.entries(data).filter(([, value]) => value !== undefined),
      ),
      select: {
        id: true,
        fullName: true,
        username: true,
        email: true,
        phone: true,
        image: true,
        role: true,
        isActive: true,
        createdAt: true,
      },
    });
  }

  async updateUser(
    id: number,
    dto: UpdateUserDto,
    currentUserId: number,
    currentUserRole: UserRole,
  ) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: { Mentor: true },
    });
    if (!user) {
      throw new NotFoundException('Foydalanuvchi topilmadi');
    }

    if (
      currentUserRole === UserRole.ADMIN &&
      user.role === UserRole.SUPERADMIN
    ) {
      throw new ForbiddenException(
        'ADMIN SUPERADMIN foydalanuvchini tahrirlay olmaydi',
      );
    }

    if (
      currentUserRole === UserRole.ADMIN &&
      dto.role === UserRole.SUPERADMIN
    ) {
      throw new ForbiddenException(
        "ADMIN foydalanuvchini SUPERADMIN roliga o'zgartira olmaydi",
      );
    }

    if (dto.email && dto.email !== user.email) {
      const emailExists = await this.prisma.user.findUnique({
        where: { email: dto.email },
      });
      if (emailExists) {
        throw new BadRequestException('Bu email allaqachon band');
      }
    }

    if (dto.username && dto.username !== user.username) {
      const usernameExists = await this.prisma.user.findUnique({
        where: { username: dto.username },
      });
      if (usernameExists) {
        throw new BadRequestException('Bu username allaqachon band');
      }
    }

    if (dto.phone && dto.phone !== user.phone) {
      const phoneExists = await this.prisma.user.findUnique({
        where: { phone: dto.phone },
      });
      if (phoneExists) {
        throw new BadRequestException('Bu telefon raqam allaqachon band');
      }
    }

    const mentorFieldsProvided =
      dto.about !== undefined ||
      dto.experience !== undefined ||
      dto.telegram !== undefined ||
      dto.linkedin !== undefined;

    const targetRole = dto.role ?? user.role;
    if (mentorFieldsProvided && targetRole !== UserRole.MENTOR) {
      throw new BadRequestException(
        'Mentor maydonlari faqat MENTOR uchun ruxsat etiladi',
      );
    }

    const userData: Record<string, unknown> = {
      fullName: dto.fullName,
      username: dto.username,
      email: dto.email,
      phone: dto.phone,
      role: dto.role,
      image: dto.image,
    };

    if (dto.password) {
      userData.password = await bcrypt.hash(dto.password, 10);
    }

    const filteredUserData = Object.fromEntries(
      Object.entries(userData).filter(([, value]) => value !== undefined),
    );

    const result = await this.prisma.$transaction(async (tx) => {
      const updatedUser = await tx.user.update({
        where: { id },
        data: filteredUserData,
        select: {
          id: true,
          fullName: true,
          username: true,
          email: true,
          phone: true,
          image: true,
          role: true,
          isActive: true,
          createdAt: true,
          Mentor: {
            select: {
              about: true,
              experience: true,
              telegram: true,
              linkedin: true,
            },
          },
        },
      });

      if (targetRole === UserRole.MENTOR && mentorFieldsProvided) {
        const mentorData = Object.fromEntries(
          Object.entries({
            about: dto.about,
            experience: dto.experience,
            telegram: dto.telegram,
            linkedin: dto.linkedin,
          }).filter(([, value]) => value !== undefined),
        );

        if (Object.keys(mentorData).length > 0) {
          if (user.Mentor) {
            await tx.mentor.update({ where: { userId: id }, data: mentorData });
          } else {
            await tx.mentor.create({
              data: {
                userId: id,
                about: dto.about,
                experience: dto.experience ?? 0,
                telegram: dto.telegram,
                linkedin: dto.linkedin,
              },
            });
          }
        }
      }

      return updatedUser;
    });

    return result;
  }

  async removeUser(
    id: number,
    currentUserId: number,
    currentUserRole: UserRole,
  ) {
    if (id === currentUserId) {
      throw new BadRequestException("O'zingizni o'chira olmaysiz");
    }

    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) {
      throw new NotFoundException('Foydalanuvchi topilmadi');
    }

    if (
      currentUserRole === UserRole.ADMIN &&
      user.role === UserRole.SUPERADMIN
    ) {
      throw new ForbiddenException(
        "ADMIN SUPERADMIN foydalanuvchini o'chira olmaydi",
      );
    }

    if (user.role === UserRole.MENTOR) {
      const [primaryGroupsCount, assistingGroupsCount, coursesCount] =
        await Promise.all([
          this.prisma.group.count({ where: { mentorId: id } }),
          this.prisma.groupMentor.count({ where: { mentorId: id } }),
          this.prisma.course.count({ where: { mentorId: id } }),
        ]);

      if (primaryGroupsCount + assistingGroupsCount + coursesCount > 0) {
        throw new ConflictException(
          "Bu o'qituvchiga bog'langan kurs yoki guruhlar bor, avval ularni boshqa o'qituvchiga o'tkazing",
        );
      }
    }

    try {
      const result = await this.prisma.user.deleteMany({ where: { id } });
      if (result.count === 0) {
        throw new NotFoundException('Foydalanuvchi topilmadi');
      }
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2003') {
          throw new ConflictException(
            "Foydalanuvchiga bog'langan ma'lumotlar bor, avval ularni ajrating",
          );
        }
        if (error.code === 'P2025') {
          throw new NotFoundException('Foydalanuvchi topilmadi');
        }
      }
      throw error;
    }

    return { message: "Foydalanuvchi o'chirildi" };
  }

  async verifyEmail(token: string): Promise<{ message: string }> {
    const user = await this.prisma.user.findFirst({
      where: { emailVerificationToken: token },
    });

    if (!user) {
      throw new NotFoundException("Noto'g'ri yoki eskirgan tasdiqlash linki");
    }

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        isActive: true,
        emailVerificationToken: null,
      },
    });

    return {
      message:
        'Email muvaffaqiyatli tasdiqlandi. Endi tizimga kirishingiz mumkin',
    };
  }

  async refreshTokens(userId: number, rt: string): Promise<Tokens> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });

    if (!user || !user.refreshToken) {
      throw new ForbiddenException('Kirish rad etildi');
    }

    const rtMatches = await bcrypt.compare(rt, user.refreshToken);
    if (!rtMatches) {
      throw new ForbiddenException('Kirish rad etildi');
    }

    const tokens = await this.generateTokens(
      user.id,
      user.email,
      user.username,
      user.role,
    );
    await this.updateRefreshToken(user.id, tokens.refreshToken);
    return tokens;
  }

  async validateUser(login: string, password: string) {
    const user = await this.prisma.user.findFirst({
      where: { OR: [{ email: login }, { username: login }, { phone: login }] },
    });
    if (!user) return null;

    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) return null;

    return user;
  }

  private async generateTokens(
    userId: number,
    email: string,
    username: string,
    role: UserRole,
  ): Promise<Tokens> {
    const payload: JwtPayload = { sub: userId, email, username, role };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: process.env.JWT_ACCESS_SECRET ?? 'at-secret',
        expiresIn: '1h',
      }),
      this.jwtService.signAsync(payload, {
        secret: process.env.JWT_REFRESH_SECRET ?? 'rt-secret',
        expiresIn: '7d',
      }),
    ]);

    return { accessToken, refreshToken };
  }

  private async updateRefreshToken(userId: number, rt: string): Promise<void> {
    const hashedRt = await bcrypt.hash(rt, 10);
    await this.prisma.user.update({
      where: { id: userId },
      data: { refreshToken: hashedRt },
    });
  }
}
