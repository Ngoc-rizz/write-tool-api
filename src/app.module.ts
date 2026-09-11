import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { createObserveModule } from '@nestjs/observe';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { CommonModule } from './common/common.module';
import { PrismaModule } from './prisma/prisma.module';
import { EmailService } from './email/email.service';
import { EmailModule } from './email/email.module';
import { ChaptersService } from './chapters/chapters.service';
import { ChaptersController } from './chapters/chapters.controller';
import { ChaptersModule } from './chapters/chapters.module';

export const { ObserveModule, ObserveInstrument } = createObserveModule();

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ObserveModule.forRoot({
      appKey: 'YOUR_APP_KEY',
      appSecret: 'YOUR_APP_SECRET',
      serviceId: 'write-api',
    }),
    AuthModule,
    CommonModule,
    EmailModule,
    ChaptersModule
  ],
  controllers: [AppController, ChaptersController],
  providers: [AppService, PrismaModule, EmailService, ChaptersService],
})
export class AppModule { }
