import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateChapterDto } from './dto/create-chapter.dto';
import { UpdateChapterDto } from './dto/update-chapter.dto';
import { countWords, countChars } from 'src/common/utils/text.util';

@Injectable()
export class ChaptersService {
    constructor(private readonly prisma: PrismaService) { }

    async findAll(userId: string, documentId?: string) {
        const selectFields = {
            id: true,
            title: true,
            order: true,
            wordCount: true,
            charCount: true,
            documentId: true,
            userId: true,
            createdAt: true,
            updatedAt: true,
        };

        if (documentId) {
            const doc = await this.prisma.document.findUnique({ where: { id: documentId } });
            if (!doc) throw new NotFoundException('Documents không tồn tại');
            if (doc.userId !== userId) throw new ForbiddenException('Bạn không có quyền truy cập tài liệu này');

            return this.prisma.chapter.findMany({
                where: { documentId },
                orderBy: { order: 'asc' },
                select: selectFields,
            });
        }

        return this.prisma.chapter.findMany({
            where: { userId, documentId: null },
            orderBy: { updatedAt: 'desc' },
            select: selectFields,
        });
    }

    async findOne(userId: string, chapterId: string) {
        const chapter = await this.prisma.chapter.findUnique({
            where: { id: chapterId },
        });
        if (!chapter) throw new NotFoundException('Chapter not found');
        if (chapter.userId !== userId) throw new ForbiddenException('Bạn không có quyền truy cập chapters này');
        return chapter;
    }


    async create(userId: string, dto: CreateChapterDto) {
        if (dto.documentId) {
            const doc = await this.prisma.document.findUnique({
                where: { id: dto.documentId },
            });
            if (!doc) throw new NotFoundException('Documents không tồn tại');
            if (doc.userId !== userId) throw new ForbiddenException('Bạn không có quyền thêm chapters vào tài liệu này');
        }

        const newWordCount = countWords(dto.contentText || '');
        const newCharCount = countChars(dto.contentText || '');

        const transactions: any[] = [
            this.prisma.chapter.create({
                data: {
                    userId,
                    documentId: dto.documentId,
                    title: dto.title,
                    order: dto.order ?? 0,
                    content: dto.content ?? null,
                    contentText: dto.contentText ?? null,
                    wordCount: newWordCount,
                    charCount: newCharCount,
                },
            })
        ];

        if (dto.documentId && newWordCount > 0) {
            transactions.push(
                this.prisma.document.update({
                    where: { id: dto.documentId },
                    data: { wordCount: { increment: newWordCount } },
                })
            );
        }

        const [createdChapter] = await this.prisma.$transaction(transactions);
        return createdChapter;
    }

    async update(userId: string, chapterId: string, dto: UpdateChapterDto) {
        await this.findOne(userId, chapterId);
        return this.prisma.chapter.update({
            where: { id: chapterId },
            data: dto,
        });
    }

    async updateContent(userId: string, chapterId: string, content: any, contentText: string) {
        const chapter = await this.findOne(userId, chapterId);

        const newWordCount = countWords(contentText);
        const newCharCount = countChars(contentText);
        const diff = newWordCount - chapter.wordCount;

        const transactions: any[] = [
            this.prisma.chapter.update({
                where: { id: chapterId },
                data: { content: content ?? null, contentText, wordCount: newWordCount, charCount: newCharCount },
            })
        ];

        if (chapter.documentId) {
            transactions.push(
                this.prisma.document.update({
                    where: { id: chapter.documentId },
                    data: { wordCount: { increment: diff } },
                })
            );
        }

        const [updatedChapter] = await this.prisma.$transaction(transactions);
        return updatedChapter;
    }

    async remove(userId: string, chapterId: string) {
        const chapter = await this.findOne(userId, chapterId);

        const transactions: any[] = [
            this.prisma.chapter.delete({ where: { id: chapterId } })
        ];

        if (chapter.documentId) {
            transactions.push(
                this.prisma.document.update({
                    where: { id: chapter.documentId },
                    data: {
                        wordCount: { decrement: chapter.wordCount }
                    },
                })
            );
        }

        await this.prisma.$transaction(transactions);

        return { message: 'Đã xoá chapters' };
    }


}
