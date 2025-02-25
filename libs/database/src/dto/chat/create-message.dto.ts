import { IsDefined, IsNotEmpty, IsString, MinLength } from "class-validator";

export class CreateMessageDto {
	@IsDefined()
	@IsNotEmpty()
	@IsString()
	content: string;

	fileUrl?: string;
}
