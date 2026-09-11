import { ApiProperty } from "@nestjs/swagger";
import { IsInt, IsNotEmpty, IsString, Min } from "class-validator";

export class CreateChapterDto {
    @ApiProperty()
    @IsString()
    @IsNotEmpty()
    documentId: string;

    @ApiProperty()
    @IsNotEmpty()
    @IsString()
    title: string;

    @ApiProperty()
    @IsInt()
    @Min(0)
    order: number;
}