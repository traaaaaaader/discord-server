import { forwardRef, Module } from '@nestjs/common';

import { PrismaModule } from '../prisma/prisma.module';

import { ConversationMessagesController } from './conversationMessages.controller';
import { ConversationMessagesService } from './conversationMessages.service';

import { UsersModule } from '../users/users.module';
import { ChatModule } from '../chat.module';

@Module({
  imports: [
    PrismaModule,
    UsersModule,
    forwardRef(() => ChatModule),
  ],
  controllers: [ConversationMessagesController],
  providers: [ConversationMessagesService],
})
export class ConversationMessagesModule {}
