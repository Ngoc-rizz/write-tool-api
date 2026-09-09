import { IsEmail, IsNotEmpty, IsString, MinLength, MaxLength } from "class-validator";

export class RegisterDTO {
    @IsString()
    @IsNotEmpty()
    name: string;

    @IsEmail()
    @IsNotEmpty()
    email: string;

    @IsString()
    @IsNotEmpty()
    @MinLength(6)
    @MaxLength(32)
    password: string;
}
