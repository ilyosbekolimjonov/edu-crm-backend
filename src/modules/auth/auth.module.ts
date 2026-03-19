import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { PrismaModule } from '../../common/prisma/prisma.module';
import { MailService } from '../../common/mail/mail.service';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { AtStrategy } from './strategies/at.strategy';
import { RtStrategy } from './strategies/rt.strategy';
import { RolesGuard } from '../../common/guards/roles.guard';

@Module({
  imports: [PrismaModule, PassportModule, JwtModule.register({})],
  controllers: [AuthController],
  providers: [AuthService, MailService, AtStrategy, RtStrategy, RolesGuard],
  exports: [AuthService, AtStrategy, RtStrategy, RolesGuard],
})
export class AuthModule {}
