import { Module } from '@nestjs/common';
import { PrismaModule } from '@/prisma/prisma.module';
import { AuthModule } from '@/auth/auth.module';
import { ChaptersController } from './chapters.controller';
import { ChaptersService } from './chapters.service';

@Module({
    imports: [PrismaModule, AuthModule],
    controllers: [ChaptersController],
    providers: [ChaptersService]
})
export class ChaptersModule { }
