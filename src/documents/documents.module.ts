import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module.js';
import { AuthModule } from '@/auth/auth.module.js';
import { DocumentsService } from './documents.service.js';
import { DocumentsController } from './documents.controller.js';

@Module({
    imports: [PrismaModule, AuthModule],
    controllers: [DocumentsController],
    providers: [DocumentsService],
})
export class DocumentsModule { }
