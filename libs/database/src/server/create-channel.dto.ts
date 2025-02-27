import { ChannelType } from '@prisma/client';
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
