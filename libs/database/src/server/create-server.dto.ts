import { IsDefined, IsNotEmpty, IsString, MinLength } from 'class-validator';

export class CreateServerDto {
  @IsDefined()
  @IsNotEmpty()
  @IsString()
  @MinLength(5)
  name: string;
  @IsDefined()
  @IsNotEmpty()
  @IsString()
  imageUrl: string;
}
