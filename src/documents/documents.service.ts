import { PrismaService } from '@/prisma/prisma.service';
import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CreateDocumentDto } from './dto/create-document.dto';
import { DocumentListQueryDto } from './dto/document-list-query.dto';
import { UpdateDocumentDto } from './dto/update-document.dto';

@Injectable()
export class DocumentsService {
    constructor(private readonly prisma: PrismaService) { }

    async findAll(userId: string, query: DocumentListQueryDto) {
        const { search, sortBy = 'updatedAt', page = 1, limit = 20 } = query;

        const where = {
            userId,
            ...(search && {
                title: {
                    contains: search, mode: 'insensitive' as const
                }
            })
        }

        const [items, total] = await this.prisma.$transaction([
            this.prisma.document.findMany({
                where,
                orderBy: { [sortBy]: 'desc' },
                skip: (page - 1) * limit,
                take: limit,
                include: { _count: { select: { chapters: true } } }
            }),
            this.prisma.document.count({ where })
        ])

        const data = items.map((doc) => ({
            id: doc.id,
            title: doc.title,
            summary: doc.summary,
            wordCount: doc.wordCount,
            chapterCount: doc._count.chapters,
            updatedAt: doc.updatedAt,
        }));

        return {
            data,
            meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
        };
    }

    async findOne(userId: string, documentId: string) {
        const doc = await this.prisma.document.findUnique({
            where: { id: documentId },
            include: { chapters: { orderBy: { order: 'asc' } } },
        });

        if (!doc) throw new NotFoundException('Tài liệu không tồn tại');
        if (doc.userId !== userId) throw new ForbiddenException('Bạn không có quyền truy cập tài liệu này');
        return doc;
    }



    async create(userId: string, dto: CreateDocumentDto) {
        return this.prisma.document.create({
            data: { ...dto, userId }
        })
    }

    async update(userId: string, documentId: string, dto: UpdateDocumentDto) {
        await this.findOne(userId, documentId);

        return this.prisma.document.update({
            where: { id: documentId },
            data: dto,
        });
    }

    async remove(userId: string, documentId: string) {
        await this.findOne(userId, documentId);

        await this.prisma.document.delete({ where: { id: documentId } });

        return { message: 'Đã xoá tài liệu' };
    }
}
