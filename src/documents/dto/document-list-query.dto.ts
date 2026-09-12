import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString } from 'class-validator';
import { Type } from 'class-transformer';

export enum DocumentSortBy {
    UPDATED_AT = 'updatedAt',
    CREATED_AT = 'createdAt',
    TITLE = 'title',
}

export class DocumentListQueryDto {
    @ApiPropertyOptional({ description: 'Tìm theo tên tài liệu' })
    @IsOptional()
    @IsString()
    search?: string;

    @ApiPropertyOptional({ enum: DocumentSortBy, default: DocumentSortBy.UPDATED_AT })
    @IsOptional()
    @IsEnum(DocumentSortBy)
    sortBy?: DocumentSortBy = DocumentSortBy.UPDATED_AT;

    @ApiPropertyOptional({ default: 1 })
    @IsOptional()
    @Type(() => Number)
    page?: number = 1;

    @ApiPropertyOptional({ default: 20 })
    @IsOptional()
    @Type(() => Number)
    limit?: number = 20;
}