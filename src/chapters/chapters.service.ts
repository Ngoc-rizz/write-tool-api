import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateChapterDto } from './dto/create-chapter.dto';
import { UpdateChapterDto } from './dto/update-chapter.dto';

@Injectable()
export class ChaptersService {
    constructor(private readonly prisma: PrismaService) { }

    async findAllByDocumentId(documentId: string) {
        return this.prisma.chapter.findMany({
            where: { documentId },
            orderBy: { order: 'asc' },
        });
    }

    async findOne(chapterId: string) {
        const chapter = await this.prisma.chapter.findUnique({ where: { id: chapterId } })
        if (!chapter) throw new Error("Chapter not found");
        return chapter;
    }


    async create(dto: CreateChapterDto) {
        return this.prisma.chapter.create({
            data: {
                documentId: dto.documentId,
                title: dto.title,
                order: dto.order,
            },
        });
    }

    async update(chapterId: string, dto: UpdateChapterDto) {
        await this.findOne(chapterId);
        return this.prisma.chapter.update({
            where: { id: chapterId },
            data: dto,
        });
    }

    async updateContent(chapterId: string, content: string) {
        const chapter = await this.findOne(chapterId);

        const newWordCount = this.countWords(content);
        const newCharCount = this.countChars(content);
        const diff = newWordCount - chapter.wordCount;

        const [updatedChapter] = await this.prisma.$transaction([
            this.prisma.chapter.update({
                where: { id: chapterId },
                data: { content, wordCount: newWordCount, charCount: newCharCount },
            }),
            this.prisma.document.update({
                where: { id: chapter.documentId },
                data: { wordCount: { increment: diff } },
            }),
        ]);
        return updatedChapter
    }

    async remove(chapterId: string) {
        const chapter = await this.findOne(chapterId);

        await this.prisma.$transaction([
            this.prisma.chapter.delete({ where: { id: chapterId } }),
            this.prisma.document.update({
                where: { id: chapter.documentId },
                data: { wordCount: { decrement: chapter.wordCount } },
            }),
        ]);

        return { message: 'Đã xoá chương' };
    }

    private countWords(text: string): number {
        if (!text) return 0;
        return text.trim().split(/\s+/).filter(Boolean).length;
    }

    private countChars(text: string): number {
        return text?.length ?? 0;
    }
}
