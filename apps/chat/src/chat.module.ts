import { Module } from '@nestjs/common';

import { MessagesModule } from './messages/messages.module';

import { DirectMessagesModule } from './direct-messages/direct-messages.module';
import { UsersModule } from './users/users.module';

@Module({
  imports: [DirectMessagesModule, MessagesModule, UsersModule],
})
export class ChatModule {}
