import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ChaptersService } from './chapters.service';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { CreateChapterDto } from './dto/create-chapter.dto';
import { UpdateChapterDto } from './dto/update-chapter.dto';
import { UpdateChapterContentDto } from './dto/update-chapter-content.dto';

@Controller('chapters')
@ApiTags('Chapters')
export class ChaptersController {
    constructor(private readonly chaptersService: ChaptersService) { }

    @Post()
    @ApiOperation({ summary: 'Tạo chương mới' })
    create(@Body() dto: CreateChapterDto) {
        return this.chaptersService.create(dto);
    }

    @Get()
    @ApiOperation({ summary: 'Lấy danh sách chương theo Document' })
    findAll(@Query('documentId') documentId: string) {
        return this.chaptersService.findAllByDocumentId(documentId);
    }

    @Get(':id')
    @ApiOperation({ summary: 'Lấy chi tiết 1 chương' })
    findOne(@Param('id') id: string) {
        return this.chaptersService.findOne(id);
    }

    @Patch(':id')
    @ApiOperation({ summary: 'Cập nhật tiêu đề/thứ tự chương' })
    update(@Param('id') id: string, @Body() dto: UpdateChapterDto) {
        return this.chaptersService.update(id, dto);
    }

    @Patch(':id/content')
    @ApiOperation({ summary: 'Cập nhật nội dung chương (autosave)' })
    updateContent(@Param('id') id: string, @Body() dto: UpdateChapterContentDto) {
        return this.chaptersService.updateContent(id, dto.content);
    }

    @Delete(':id')
    @ApiOperation({ summary: 'Xoá chương' })
    remove(@Param('id') id: string) {
        return this.chaptersService.remove(id);
    }
}
