import { ApiProperty } from "@nestjs/swagger";
import { IsInt, IsNotEmpty, IsOptional, IsString, Min } from "class-validator";

export class CreateChapterDto {
    @ApiProperty({ required: false })
    @IsString()
    @IsOptional()
    documentId?: string;

    @ApiProperty()
    @IsNotEmpty()
    @IsString()
    title: string;

    @ApiProperty()
    @IsInt()
    @Min(0)
    @IsOptional()
    order?: number;

    @ApiProperty({ required: false })
    @IsOptional()
    content?: any;

    @ApiProperty({ required: false })
    @IsString()
    @IsOptional()
    contentText?: string;
}