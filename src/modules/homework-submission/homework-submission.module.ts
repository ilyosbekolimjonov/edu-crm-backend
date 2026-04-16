import { Module } from '@nestjs/common';
import { PrismaModule } from '../../common/prisma/prisma.module';
import { HomeworkSubmissionService } from './homework-submission.service';
import {
  HomeworkSubmissionController,
  HomeworkSubmissionListController,
  SubmissionReviewController,
} from './homework-submission.controller';

@Module({
  imports: [PrismaModule],
  controllers: [
    HomeworkSubmissionController,
    HomeworkSubmissionListController,
    SubmissionReviewController,
  ],
  providers: [HomeworkSubmissionService],
})
export class HomeworkSubmissionModule {}
