import { Controller } from '@nestjs/common';
import { EventPattern, Payload } from '@nestjs/microservices';

import { EditUserDto } from '@app/database';
import { UsersService } from './users.service';

@Controller()
export class UsersController {
	constructor(
		private readonly usersService: UsersService,
	) {}

	@EventPattern({ cmd: 'edit-user' })
	async editUser(@Payload() payload: { userId: string; body: EditUserDto }) {
		await this.usersService.edit(payload.userId, payload.body);
	}
}

