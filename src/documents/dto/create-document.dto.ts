import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateDocumentDto {
    @ApiProperty()
    @IsString()
    @IsNotEmpty()
    title: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    summary?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    note?: string;

    @ApiPropertyOptional({ default: 'Vietnamese' })
    @IsOptional()
    @IsString()
    language?: string;
}