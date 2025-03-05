import { Module } from '@nestjs/common';

import { MessagesModule } from './messages/messages.module';

import { ConversationsModule } from './conversations/conversations.module';
import { UsersModule } from './users/users.module';
import { ConversationMessagesModule } from './conversationMessages/conversationMessages.module';

@Module({
  imports: [
    ConversationMessagesModule,
    ConversationsModule,
    MessagesModule,
    UsersModule,
  ],
})
export class ChatModule {}
