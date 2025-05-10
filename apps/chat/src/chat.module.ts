import { forwardRef, Module } from '@nestjs/common';
import { PrometheusModule } from '@willsoto/nestjs-prometheus';

import { MessagesModule } from './messages/messages.module';

import { ConversationsModule } from './conversations/conversations.module';
import { UsersModule } from './users/users.module';
import { ConversationMessagesModule } from './conversationMessages/conversationMessages.module';
import { HealthModule } from './health/health.module';
import { ConfigModule } from '@nestjs/config';
import { ChatGateway } from './chat.gateway';
import { MediasoupModule } from './mediasoup/mediasoup.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: `.env.${process.env.NODE_ENV || 'development'}`,
    }),
    PrometheusModule.register({
      path: '/metrics',
      defaultMetrics: {
        enabled: true,
      },
    }),
    forwardRef(() => MessagesModule),
    forwardRef(() => ConversationMessagesModule),
    ConversationsModule,
    UsersModule,
    HealthModule,
    MediasoupModule,
  ],
  providers: [ChatGateway],
  exports: [ChatGateway],
})
export class ChatModule {}
