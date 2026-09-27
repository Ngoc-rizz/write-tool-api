import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module.js';
import { AuthModule } from '../auth/auth.module.js';
import { ChaptersController } from './chapters.controller.js';
import { ChaptersService } from './chapters.service.js';

@Module({
    imports: [PrismaModule, AuthModule],
    controllers: [ChaptersController],
    providers: [ChaptersService]
})
export class ChaptersModule { }
