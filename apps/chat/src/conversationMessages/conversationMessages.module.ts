import { Module } from '@nestjs/common';

import { PrismaModule } from '../prisma/prisma.module';

import { ConversationMessagesController } from './conversationMessages.controller';
import { ConversationMessagesService } from './conversationMessages.service';
import { ChatGateway } from '../chat.gateway';

import { UsersModule } from '../users/users.module';

@Module({
  imports: [
    PrismaModule,
    UsersModule,
  ],
  controllers: [ConversationMessagesController],
  providers: [ConversationMessagesService, ChatGateway],
})
export class ConversationMessagesModule {}
