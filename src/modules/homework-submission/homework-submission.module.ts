import { Module } from '@nestjs/common';
import { PrismaModule } from '../../common/prisma/prisma.module';
import { HomeworkSubmissionService } from './homework-submission.service';
import { HomeworkSubmissionController } from './homework-submission.controller';

@Module({
  imports: [PrismaModule],
  controllers: [HomeworkSubmissionController],
  providers: [HomeworkSubmissionService],
})
export class HomeworkSubmissionModule {}
