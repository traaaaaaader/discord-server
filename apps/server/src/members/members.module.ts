import { Module } from '@nestjs/common';

import { PrismaModule } from '../prisma/prisma.module';
import { MembersService } from './members.service';
import { MembersController } from './members.controller';

@Module({
  imports: [PrismaModule],
  controllers: [MembersController],
  providers: [MembersService],
})
export class MembersModule {}
