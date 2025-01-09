import { IsDefined, IsEmail, IsNotEmpty, IsString, MinLength } from "class-validator";

export class RegisterDto {
	@IsDefined()
	@IsNotEmpty()
	@IsString()
	name: string;

	@IsDefined()
	@IsNotEmpty()
	@IsEmail()
	email: string;

	@IsDefined()
	@IsNotEmpty()
	@IsString()
	@MinLength(6)
	password: string;

	imageUrl?: string;
}