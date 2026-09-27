import {
    Body,
    Controller,
    Delete,
    Get,
    Param,
    Patch,
    Post,
    Query,
    UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '@/common/strategies/jwt-auth.guard.js';
import { CurrentUser } from '@/common/decorators/current-user.decorator.js';
import type { JwtPayload } from '@/common/decorators/current-user.decorator.js';
import { DocumentsService } from './documents.service.js';
import { CreateDocumentDto } from './dto/create-document.dto.js';
import { UpdateDocumentDto } from './dto/update-document.dto.js';
import { DocumentListQueryDto } from './dto/document-list-query.dto.js';

@ApiTags('documents')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('documents')
export class DocumentsController {
    constructor(private readonly documentsService: DocumentsService) { }

    @Post()
    @ApiOperation({ summary: 'Create new document' })
    create(@CurrentUser() user: JwtPayload, @Body() dto: CreateDocumentDto) {
        return this.documentsService.create(user.userId, dto);
    }

    @Get()
    @ApiOperation({ summary: 'Lấy danh sách tài liệu (trang chủ)' })
    findAll(@CurrentUser() user: JwtPayload, @Query() query: DocumentListQueryDto) {
        return this.documentsService.findAll(user.userId, query);
    }

    @Get(':id')
    @ApiOperation({ summary: 'Lấy chi tiết tài liệu kèm danh sách chapters' })
    findOne(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
        return this.documentsService.findOne(user.userId, id);
    }

    @Patch(':id')
    @ApiOperation({ summary: 'Cập nhật tài liệu' })
    update(@CurrentUser() user: JwtPayload, @Param('id') id: string, @Body() dto: UpdateDocumentDto) {
        return this.documentsService.update(user.userId, id, dto);
    }

    @Delete(':id')
    @ApiOperation({ summary: 'Xoá tài liệu' })
    remove(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
        return this.documentsService.remove(user.userId, id);
    }
}