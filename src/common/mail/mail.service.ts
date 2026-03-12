import { Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

@Injectable()
export class MailService {
    private readonly logger = new Logger(MailService.name);
    private transporter: nodemailer.Transporter;

    constructor() {
        this.transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.MAIL_USER,
                pass: process.env.MAIL_PASS,
            },
        });
    }

    async sendVerificationEmail(to: string, token: string): Promise<void> {
        const appUrl = process.env.APP_URL ?? 'http://localhost:3000';
        const verificationUrl = `${appUrl}/auth/verify-email?token=${token}`;

        try {
            await this.transporter.sendMail({
                from: `"O'quv Markazi" <${process.env.MAIL_USER}>`,
                to,
                subject: 'Email manzilingizni tasdiqlang',
                html: `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                        <h2 style="color: #333;">Email manzilingizni tasdiqlang</h2>
                        <p>Xush kelibsiz! Hisobingizni faollashtirish uchun quyidagi tugmani bosing:</p>
                        <a href="${verificationUrl}"
                            style="display:inline-block; padding:12px 24px; background:#4F46E5;
                                color:#fff; text-decoration:none; border-radius:6px; margin:16px 0;"> Emailni tasdiqlash
                        </a>
                        <p>Yoki quyidagi havolani brauzeringizga ko'chiring:</p>
                        <p style="word-break:break-all; color:#4F46E5;">${verificationUrl}</p>
                        <p style="color:#888; font-size:13px;">Ushbu havola 24 soat davomida amal qiladi.</p>
                    </div>
                `,
            });
        } catch (error) {
            this.logger.error(`Email yuborishda xato: ${(error as Error).message}`);
            throw new InternalServerErrorException('Email yuborishda xatolik yuz berdi');
        }
    }
}
