import { Module } from '@nestjs/common';
// import { AppController } from './app.controller';
// import { AppService } from './app.service';
import { PrismaModule } from './common/prisma/prisma.module';
import { AuthModule } from './modules/auth/auth.module';
import { MentorModule } from './modules/mentor/mentor.module';
import { CourseModule } from './modules/course/course.module';
import { PurchasedCourseModule } from './modules/purchased-course/purchased-course.module';
import { RoomModule } from './modules/room/room.module';
import { GroupModule } from './modules/group/group.module';
import { LessonGroupModule } from './modules/lesson-group/lesson-group.module';
import { LessonModule } from './modules/lesson/lesson.module';
import { HomeworkModule } from './modules/homework/homework.module';
import { HomeworkSubmissionModule } from './modules/homework-submission/homework-submission.module';
import { ConfigModule } from '@nestjs/config';

@Module({
    imports: [
        ConfigModule.forRoot({ isGlobal: true }),
        PrismaModule,
        AuthModule,
        MentorModule,
        CourseModule,
        PurchasedCourseModule,
        RoomModule,
        GroupModule,
        LessonGroupModule,
        LessonModule,
        HomeworkModule,
        HomeworkSubmissionModule,
    ],
    // controllers: [AppController],
    // providers: [AppService],
})
export class AppModule { }
