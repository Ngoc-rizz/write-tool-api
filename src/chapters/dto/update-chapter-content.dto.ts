import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional } from 'class-validator';

export class UpdateChapterContentDto {
    @ApiProperty()
    @IsOptional()
    content: any;

    @ApiProperty()
    @IsString()
    contentText: string;
}