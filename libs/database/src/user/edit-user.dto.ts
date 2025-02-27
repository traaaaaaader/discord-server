import { IsDefined, IsNotEmpty, IsString, MinLength } from "class-validator";

export class EditUserDto {
	@IsDefined()
	@IsNotEmpty()
	@IsString()
	@MinLength(1)
	name: string;

	@IsDefined()
	@IsNotEmpty()
	@IsString()
	imageUrl: string;
}