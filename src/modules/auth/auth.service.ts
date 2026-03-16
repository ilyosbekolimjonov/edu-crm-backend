import { BadRequestException, ForbiddenException, Injectable, NotFoundException, UnauthorizedException, } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UserRole } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { randomBytes } from 'crypto';
import { PrismaService } from '../../common/prisma/prisma.service';
import { MailService } from '../../common/mail/mail.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { JwtPayload } from '../../common/types/jwt-payload.type';

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
    ) { }

    async register(dto: RegisterDto, creatorRole: UserRole): Promise<{ message: string }> {
        const allowedCreators: UserRole[] = [UserRole.SUPERADMIN, UserRole.ADMIN];
        if (!allowedCreators.includes(creatorRole)) {
            throw new ForbiddenException('Faqat ADMIN yoki SUPERADMIN yangi foydalanuvchi yarata oladi');
        }

        if ( creatorRole === UserRole.ADMIN && dto.role && ([UserRole.SUPERADMIN, UserRole.ADMIN] as UserRole[]).includes(dto.role)) {
            throw new ForbiddenException('ADMIN faqat STUDENT, MENTOR, ADMIN yoki ASSISTANT yarata oladi');
        }

        const existingUser = await this.prisma.user.findFirst({
            where: { OR: [{ email: dto.email }, { username: dto.username }, { phone: dto.phone }] },
        });
        if (existingUser) {
            throw new BadRequestException('Bu email, username yoki telefon raqam allaqachon band');
        }

        const hashedPassword = await bcrypt.hash(dto.password, 10);
        const verificationToken = randomBytes(32).toString('hex');

        const user = await this.prisma.user.create({
            data: {
                fullName: dto.fullName,
                username: dto.username,
                email: dto.email,
                phone: dto.phone,
                password: hashedPassword,
                role: dto.role ?? UserRole.STUDENT,
                isActive: false,
                emailVerificationToken: verificationToken,
            },
        });

        if ((dto.role ?? UserRole.STUDENT) === UserRole.MENTOR) {
            await this.prisma.mentor.create({
                data: {
                    userId: user.id,
                    about: dto.about,
                    experience: dto.experience ?? 0,
                    telegram: dto.telegram,
                    linkedin: dto.linkedin,
                },
            });
        }

        await this.mailService.sendVerificationEmail(user.email, verificationToken);

        return { message: `Foydalanuvchi yaratildi. Tasdiqlash linki ${user.email} ga yuborildi` };
    }

    async login(dto: LoginDto): Promise<Tokens> {
        const user = await this.prisma.user.findFirst({
            where: { OR: [{ email: dto.login }, { username: dto.login }] },
        });

        if (!user) {
            throw new UnauthorizedException("Email yoki username noto'g'ri");
        }

        const passwordMatch = await bcrypt.compare(dto.password, user.password);
        if (!passwordMatch) {
            throw new UnauthorizedException("Parol noto'g'ri");
        }

        if (!user.isActive) {
            throw new ForbiddenException('Hisobingiz faollashtiriilmagan. Email manzilingizni tasdiqlang');
        }

        const tokens = await this.generateTokens(user.id, user.email, user.username, user.role);
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

        return { message: 'Email muvaffaqiyatli tasdiqlandi. Endi tizimga kirishingiz mumkin' };
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

        const tokens = await this.generateTokens(user.id, user.email, user.username, user.role);
        await this.updateRefreshToken(user.id, tokens.refreshToken);
        return tokens;
    }

    async validateUser(login: string, password: string) {
        const user = await this.prisma.user.findFirst({
            where: { OR: [{ email: login }, { username: login }] },
        });
        if (!user) return null;

        const passwordMatch = await bcrypt.compare(password, user.password);
        if (!passwordMatch) return null;

        return user;
    }

    private async generateTokens( userId: number, email: string, username: string, role: UserRole, ): Promise<Tokens> {
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
