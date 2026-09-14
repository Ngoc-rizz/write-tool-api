import { Module } from '@nestjs/common';
import { PrismaModule } from '@/prisma/prisma.module';
import { AuthModule } from '@/auth/auth.module';
import { DocumentsService } from './documents.service';
import { DocumentsController } from './documents.controller';

@Module({
    imports: [PrismaModule, AuthModule],
    controllers: [DocumentsController],
    providers: [DocumentsService],
})
export class DocumentsModule { }
