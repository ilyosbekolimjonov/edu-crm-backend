import { Module } from '@nestjs/common';
import { PrismaModule } from '../../common/prisma/prisma.module';
import { PurchasedCourseService } from './purchased-course.service';
import { PurchasedCourseController } from './purchased-course.controller';

@Module({
  imports: [PrismaModule],
  controllers: [PurchasedCourseController],
  providers: [PurchasedCourseService],
})
export class PurchasedCourseModule {}
