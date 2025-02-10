import { IsDefined, IsNotEmpty, IsString, MinLength } from "class-validator";

export class CreateMessageDto {
	@IsDefined()
	@IsNotEmpty()
	@IsString()
	@MinLength(5)
	content: string;
	@IsString()
	fileUrl?: string;
}
