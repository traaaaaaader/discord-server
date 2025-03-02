import { ChannelType } from '@prisma/db-server';
import { IsDefined, IsNotEmpty, IsString, MinLength } from 'class-validator';

export class CreateChannelDto {
  @IsDefined()
  @IsNotEmpty()
  @IsString()
  @MinLength(1)
  name: string;
  @IsDefined()
  @IsNotEmpty()
  type: ChannelType;
}
