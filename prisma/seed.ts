import { PrismaClient, UserRole } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'
import * as bcrypt from 'bcryptjs'
import 'dotenv/config'

const connectionString = process.env.DATABASE_URL || ''
const pool = new Pool({ connectionString })
const adapter = new PrismaPg(pool)

const prisma = new PrismaClient({
    adapter
})


async function main() {
    const superadminEmail = process.env.SUPERADMIN_EMAIL ?? 'codeandcoffeeandme@gmail.com';
    const superadminUsername = process.env.SUPERADMIN_USERNAME ?? 'boss';
    const superadminPassword = process.env.SUPERADMIN_PASSWORD ?? 'boss123';
    const superadminPhone = process.env.SUPERADMIN_PHONE ?? '+998901112233';

    const existing = await prisma.user.findFirst({
        where: { OR: [{ email: superadminEmail }, { username: superadminUsername }] },
    });

    if (existing) {
        console.log('⚠️  SUPERADMIN allaqachon mavjud. Seed o\'tkazib yuborildi.');
        return;
    }

    const hashedPassword = await bcrypt.hash(superadminPassword, 10);

    const superadmin = await prisma.user.create({
        data: {
            fullName: 'Ilyosbek Olimjonov',
            username: superadminUsername,
            email: superadminEmail,
            phone: superadminPhone,
            password: hashedPassword,
            role: UserRole.SUPERADMIN,
            isActive: true,
        },
    });

    console.log('✅ SUPERADMIN muvaffaqiyatli yaratildi:');
    console.log(`   ID       : ${superadmin.id}`);
    console.log(`   Username : ${superadmin.username}`);
    console.log(`   Email    : ${superadmin.email}`);
    console.log(`   Role     : ${superadmin.role}`);
}

main()
    .catch((e) => {
        console.error('❌ Seed xatosi:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
