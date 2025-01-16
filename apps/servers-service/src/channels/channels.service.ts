import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { MemberRole } from '@prisma/client';
import { PrismaService } from '@app/database';
import { CreateChannelDto } from './dto/create-channel.dto';
import { UpdateChannelDto } from './dto/update-channel.dto';

@Injectable()
export class ChannelsService {
  constructor(private readonly prismaService: PrismaService) {}

  async create(req: Request, userId: string, { name, type }: CreateChannelDto) {
    const { searchParams } = new URL(req.url);
    const serverId = searchParams.get('serverId');

    if (!userId) {
      throw new UnauthorizedException();
    }

    if (!serverId) {
      throw new BadRequestException();
    }

    return await this.prismaService.server.update({
      where: {
        id: serverId,
        members: {
          some: {
            userId: userId,
            role: {
              in: [MemberRole.ADMIN, MemberRole.MODERATOR],
            },
          },
        },
      },
      data: {
        channels: {
          create: {
            userId: userId,
            name,
            type,
          },
        },
      },
    });
  }

  async update(
    req: Request,
    channelId: string,
    userId: string,
    { name, type }: UpdateChannelDto,
  ) {
    const { searchParams } = new URL(req.url);
    const serverId = searchParams.get('serverId');

    if (!userId) {
      throw new UnauthorizedException();
    }

    if (!serverId || !channelId) {
      throw new BadRequestException();
    }

    return await await this.prismaService.server.update({
      where: {
        id: serverId,
        members: {
          some: {
            userId: userId,
            role: {
              in: [MemberRole.ADMIN, MemberRole.MODERATOR],
            },
          },
        },
      },
      data: {
        channels: {
          update: {
            where: {
              id: channelId,
            },
            data: {
              name,
              type,
            },
          },
        },
      },
    });
  }

  async delete(req: Request, channelId: string, userId: string) {
    const { searchParams } = new URL(req.url);
    const serverId = searchParams.get('serverId');

    if (!userId) {
      throw new UnauthorizedException();
    }

    if (!serverId || !channelId) {
      throw new BadRequestException();
    }

    return await this.prismaService.server.update({
			where: {
				id: serverId,
				members: {
					some: {
						userId: userId,
						role: {
							in: [MemberRole.ADMIN, MemberRole.MODERATOR],
						}
					}
				}
			},
			data: {
				channels: {
					delete: {
						id: channelId,
					}
				}
			}
		});
  }
}
