import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { ConversationsService } from './conversations.service';

@Controller()
export class ConversationsController {
  constructor(private readonly conversationsService: ConversationsService) {}

  @MessagePattern({ cmd: 'create-conversation' })
  async create(@Payload() body: { userId: string; name: string }) {
    const { userId, name } = body;
    return await this.conversationsService.create(userId, name);
  }

  @MessagePattern({ cmd: 'get-conversation' })
  async get(@Payload() userId: string) {
    return await this.conversationsService.get(userId);
  }
}
