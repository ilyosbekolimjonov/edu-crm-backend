import { Module } from '@nestjs/common';
import { PrismaModule } from '../../common/prisma/prisma.module';
import { GroupService } from './group.service';
import { GroupController } from './group.controller';

@Module({
  imports: [PrismaModule],
  controllers: [GroupController],
  providers: [GroupService],
})
export class GroupModule {}
