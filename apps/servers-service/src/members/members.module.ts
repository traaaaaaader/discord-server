import { Module } from '@nestjs/common';
import { PrismaModule } from '@app/database';
import { AuthModule } from '@app/auth';
import { MembersService } from './members.service';
import { MembersController } from './members.controller';

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [MembersController],
  providers: [MembersService],
})
export class MembersModule {}
