import { Module } from '@nestjs/common';
import { PrismaModule } from '../../common/prisma/prisma.module';
import { LessonGroupService } from './lesson-group.service';
import { LessonGroupController } from './lesson-group.controller';

@Module({
    imports: [PrismaModule],
    controllers: [LessonGroupController],
    providers: [LessonGroupService],
})
export class LessonGroupModule { }
