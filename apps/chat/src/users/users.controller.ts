import { Controller, Logger } from '@nestjs/common';
import { EventPattern, Payload } from '@nestjs/microservices';
import { EditUserDto } from '@app/database';
import { UsersService } from './users.service';

@Controller()
export class UsersController {
  private readonly logger = new Logger(UsersController.name);

  constructor(private readonly usersService: UsersService) {}

  @EventPattern({ cmd: 'edit-user' })
  async editUser(@Payload() payload: { userId: string; body: EditUserDto }) {
    this.logger.log(
      `Edit user event received: ${payload.userId}, data=${JSON.stringify(payload.body)}`,
    );

    try {
      await this.usersService.edit(payload.userId, payload.body);
      this.logger.log(`User edited successfully: ${payload.userId}`);
    } catch (error) {
      this.logger.error(
        `Edit user event failed: ${error.message}`,
        error.stack,
      );
    }
  }
}
