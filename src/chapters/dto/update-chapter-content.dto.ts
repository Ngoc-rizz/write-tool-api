import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class UpdateChapterContentDto {
    @ApiProperty()
    @IsString()
    content: string;
}