import { Module } from '@nestjs/common';
import { PrismaModule } from '../../common/prisma/prisma.module';
import { MentorController } from './mentor.controller';
import { MentorService } from './mentor.service';

@Module({
  imports: [PrismaModule],
  controllers: [MentorController],
  providers: [MentorService],
})
export class MentorModule {}
