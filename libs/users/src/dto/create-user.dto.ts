export class CreateUserDto {
	name: string;
	email: string;
	hashedPassword?: string;
	imageUrl?: string;
}