import { Module } from '@nestjs/common';
import { PrismaModule } from '../../common/prisma/prisma.module';
import { MentorController, TeacherController } from './mentor.controller';
import { MentorService } from './mentor.service';

@Module({
  imports: [PrismaModule],
  controllers: [MentorController, TeacherController],
  providers: [MentorService],
})
export class MentorModule {}
