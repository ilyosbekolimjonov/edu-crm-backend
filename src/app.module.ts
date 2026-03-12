import { Module } from '@nestjs/common';
// import { AppController } from './app.controller';
// import { AppService } from './app.service';
import { PrismaModule } from './common/prisma/prisma.module';
import { AuthModule } from './modules/auth/auth.module';
import { MentorModule } from './modules/mentor/mentor.module';
import { CourseCategoryModule } from './modules/course-category/course-category.module';
import { CourseModule } from './modules/course/course.module';
import { PurchasedCourseModule } from './modules/purchased-course/purchased-course.module';
import { ConfigModule } from '@nestjs/config';

@Module({
    imports: [
        ConfigModule.forRoot({ isGlobal: true }),
        PrismaModule,
        AuthModule,
        MentorModule,
        CourseCategoryModule,
        CourseModule,
        PurchasedCourseModule,
    ],
    // controllers: [AppController],
    // providers: [AppService],
})
export class AppModule { }
