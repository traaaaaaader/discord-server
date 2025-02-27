import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';

import { UsersService } from '@app/core-lib';
import { EditUserDto } from '@app/database';


@Controller()
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @MessagePattern({ cmd: 'get-user' })
  async get(@Payload() userId: string) {
    return await this.usersService.findOne({ id: userId });
  }

  @MessagePattern({ cmd: 'edit-user' })
  async editUser(@Payload() payload: { userId: string; body: EditUserDto }) {
    return await this.usersService.edit(payload.userId, payload.body);
  }
}
