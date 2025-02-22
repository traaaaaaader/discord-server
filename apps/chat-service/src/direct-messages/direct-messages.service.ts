import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { ChatGateway } from '../chat.gateway';
import { MemberRole } from '@prisma/client';
import { UsersService } from '@app/users';
import { CreateMessageDto } from '../../../../libs/database/src/dto/chat/create-message.dto';

@Injectable()
export class DirectMessagesService {
	readonly MESSAGES_BATCH = 10;

	constructor(
		private readonly prismaService: PrismaService,
		private readonly userService: UsersService,
		private readonly chatGateway: ChatGateway,
	) {}

	async createMessage(
		{ content, fileUrl }: CreateMessageDto,
		conversationId: string,
		userId: string,
	) {
		if (!conversationId) {
			throw new BadRequestException('Converstion ID is required');
		}

		const conversation = await this.prismaService.conversation.findFirst({
      where: {
        id: conversationId as string,
        OR: [
          {
            memberOne: {
              userId: userId,
            },
          },
          {
            memberTwo: {
							userId: userId,
            },
          },
        ],
      },
      include: {
        memberOne: {
          include: {
            user: true,
          },
        },
        memberTwo: {
          include: {
            user: true,
          },
        },
      },
    });

    if(!conversation) {
      throw new BadRequestException('Conversation not found');
    }



		const member = conversation.memberOne.userId === userId ? conversation.memberOne : conversation.memberTwo;


		if (!member) {
			throw new BadRequestException('Member not found');
		}

		
		const userFromChat = await this.prismaService.user.findFirst({
			where: {
				id: userId,
			},
		});

		if (!userFromChat) {
			const user = await this.userService.findOne({
				id: userId,
			})

			await this.prismaService.user.create({
				data: {
					id: userId,
					name: user.name,
				}
			})
		}

		const chatMember = await this.prismaService.member.findFirst({
			where: {
				id: member.id,
			},
		});

		if (!chatMember) {
			await this.prismaService.member.create({
				data: {
					id: member.id,
					role: member.role,
					userId: userId,
				},
			});
		}

		const directMessage = await this.prismaService.directMessage.create({
      data: {
        content,
        fileUrl,
        conversationId: conversationId as string,
        memberId: member.id,
      },
      include: {
        member: {
          include: {
            user: true,
          },
        },
      },
    });

		this.chatGateway.server.emit(`chat:${conversationId}:messages`, directMessage);

		return directMessage;
	}

	async updateMessage(
		content: string,
		directMessageId: string,
		conversationid: string,
		userId: string,
	) {
		const { isMessageOwner, ...data } = await this.validate(
			directMessageId,
			conversationid,
			userId,
		);

		if (!isMessageOwner) {
			throw new BadRequestException('Not allowed');
		}

		const directMessage = await this.prismaService.directMessage.update({
			where: {
				id: directMessageId as string,
			},
			data: {
				content,
			},
			include: {
				member: {
					include: {
						user: true,
					},
				},
			},
		});

		this.chatGateway.server.emit(`chat:${conversationid}:messages:update`, directMessage);

		return directMessage;
	}

	async deleteMessage(
		directMessageId: string,
		conversationid: string,
		userId: string,
	) {
		await this.validate(directMessageId, conversationid, userId);

		const directMessage = await this.prismaService.directMessage.update({
			where: {
				id: directMessageId as string,
			},
			data: {
				fileUrl: null,
				content: "This message has been deleted",
				deleted: true,
			},
			include: {
				member: {
					include: {
						user: true,
					},
				},
			},
		});

		this.chatGateway.server.emit(`chat:${conversationid}:messages:update`, directMessage);

		return directMessage;
	}

	async validate(
		directMessageId: string,
		conversationId: string,
		userId: string,
	) {
		if (!directMessageId || !conversationId) {
			throw new BadRequestException(
				'Direct Message ID and Conversation ID are required',
			);
		}

		const conversation = await this.prismaService.conversation.findFirst({
      where: {
        id: conversationId as string,
        OR: [
          {
            memberOne: {
              userId: userId,
            },
          },
          {
            memberTwo: {
							userId: userId,
            },
          },
        ],
      },
      include: {
        memberOne: {
          include: {
            user: true,
          },
        },
        memberTwo: {
          include: {
            user: true,
          },
        },
      },
    });

    if (!conversation) {
			throw new BadRequestException('Conversation not found');
    }

		const member =
		conversation.memberOne.userId === userId
			? conversation.memberOne
			: conversation.memberTwo;

		if (!member) {
			throw new BadRequestException('Member not found');
		}

		const userFromChat = await this.prismaService.user.findFirst({
      where: {
        id: userId,
      },
    });

    if (!userFromChat) {
      const user = await this.userService.findOne({
        id: userId,
      })

      await this.prismaService.user.create({
        data: {
          id: userId,
          name: user.name,
        }
      })
    }

		const chatMember = await this.prismaService.member.findFirst({
			where: {
				id: member.id,
			},
		});

		if (!chatMember) {
      await this.prismaService.member.create({
        data: {
          id: member.id,
          role: member.role,
          userId: userId,
        },
      });
		}

		const directMessage = await this.prismaService.directMessage.findFirst({
      where: {
        id: directMessageId as string,
        conversationId: conversationId as string,
      },
      include: {
        member: {
          include: {
            user: true,
          },
        },
      },
    });

		if (!directMessage || directMessage.deleted) {
			throw new BadRequestException('Direct Message not found');
		}

		const isMessageOwner = directMessage.memberId === member.id;
		const isAdmin = member.role === MemberRole.ADMIN;
		const isModerator = member.role === MemberRole.MODERATOR;
		const canModife = isMessageOwner || isAdmin || isModerator;

		if (!canModife) {
			throw new BadRequestException('Not allowed');
		}

		return { directMessage, isMessageOwner };
	}
}
