import { ApiProperty } from "@nestjs/swagger";
import { IsEmail, IsNotEmpty } from "class-validator";

export class ForgotPasswordDTO {
    @ApiProperty()
    @IsEmail()
    @IsNotEmpty()
    email: string
}