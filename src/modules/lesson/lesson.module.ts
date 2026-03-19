import { Module } from '@nestjs/common';
import { PrismaModule } from '../../common/prisma/prisma.module';
import { LessonService } from './lesson.service';
import { LessonController } from './lesson.controller';

@Module({
  imports: [PrismaModule],
  controllers: [LessonController],
  providers: [LessonService],
})
export class LessonModule {}
