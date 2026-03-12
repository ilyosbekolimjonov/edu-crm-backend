import { Module } from '@nestjs/common';
import { PrismaModule } from '../../common/prisma/prisma.module';
import { HomeworkService } from './homework.service';
import { HomeworkController } from './homework.controller';

@Module({
    imports: [PrismaModule],
    controllers: [HomeworkController],
    providers: [HomeworkService],
})
export class HomeworkModule { }
