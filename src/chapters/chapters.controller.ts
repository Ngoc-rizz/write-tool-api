import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '@/common/strategies/jwt-auth.guard.js';
import { CurrentUser } from '@/common/decorators/current-user.decorator.js';
import type { JwtPayload } from '@/common/decorators/current-user.decorator.js';
import { ChaptersService } from './chapters.service.js';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { CreateChapterDto } from './dto/create-chapter.dto.js';
import { UpdateChapterDto } from './dto/update-chapter.dto.js';
import { UpdateChapterContentDto } from './dto/update-chapter-content.dto.js';

@Controller('chapters')
@ApiTags('Chapters')
@UseGuards(JwtAuthGuard)
export class ChaptersController {
    constructor(private readonly chaptersService: ChaptersService) { }

    @Post()
    @ApiOperation({ summary: 'Tạo chapters mới' })
    create(@CurrentUser() user: JwtPayload, @Body() dto: CreateChapterDto) {
        return this.chaptersService.create(user.userId, dto);
    }

    @Get()
    @ApiOperation({ summary: 'Lấy danh sách chapters (theo Document hoặc chapters tự do)' })
    findAll(@CurrentUser() user: JwtPayload, @Query('documentId') documentId?: string) {
        return this.chaptersService.findAll(user.userId, documentId);
    }

    @Get(':id')
    @ApiOperation({ summary: 'Lấy chi tiết 1 chapters' })
    findOne(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
        return this.chaptersService.findOne(user.userId, id);
    }

    @Patch(':id')
    @ApiOperation({ summary: 'Cập nhật tiêu đề/thứ tự chapters' })
    update(@CurrentUser() user: JwtPayload, @Param('id') id: string, @Body() dto: UpdateChapterDto) {
        return this.chaptersService.update(user.userId, id, dto);
    }

    @Patch(':id/content')
    @ApiOperation({ summary: 'Cập nhật nội dung chapters (autosave)' })
    updateContent(@CurrentUser() user: JwtPayload, @Param('id') id: string, @Body() dto: UpdateChapterContentDto) {
        return this.chaptersService.updateContent(user.userId, id, dto.content, dto.contentText);
    }

    @Delete(':id')
    @ApiOperation({ summary: 'Xoá chapters' })
    remove(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
        return this.chaptersService.remove(user.userId, id);
    }
}
