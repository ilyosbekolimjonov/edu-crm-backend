import { Module } from '@nestjs/common';
import { PrismaModule } from '../../common/prisma/prisma.module';
import { CourseCategoryController } from './course-category.controller';
import { CourseCategoryService } from './course-category.service';

@Module({
    imports: [PrismaModule],
    controllers: [CourseCategoryController],
    providers: [CourseCategoryService],
    exports: [CourseCategoryService],
})
export class CourseCategoryModule { }
