import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';

import { PrismaService } from '../../prisma/prisma.service';

import { DeleteMemberPayload, UpdateMemberPayload } from '@app/database';

@Injectable()
export class MembersService {
  constructor(private readonly prismaService: PrismaService) {}

  async getOne(serverId: string, userId: string) {
    return await this.prismaService.member.findFirst({
      where: {
        serverId: serverId,
        userId: userId,
      },
    });
  }

  async getAll(serverId: string) {
    return await this.prismaService.member.findMany({
      where: {
        serverId: serverId,
      },
      include: {
        user: true,
      },
    });
  }

  async delete({ memberId, serverId, userId }: DeleteMemberPayload) {
    if (!userId) {
      throw new UnauthorizedException();
    }

    if (!memberId || !serverId) {
      throw new BadRequestException();
    }

    return await this.prismaService.server.update({
      where: {
        id: serverId,
        userId: userId,
      },
      data: {
        members: {
          deleteMany: {
            id: memberId,
            userId: {
              not: userId,
            },
          },
        },
      },
      include: {
        members: {
          include: {
            user: true,
          },
          orderBy: {
            role: 'asc',
          },
        },
      },
    });
  }

  async update({
    memberId,
    serverId,
    userId,
    updateMemberDto: { role },
  }: UpdateMemberPayload) {
    if (!userId) {
      throw new UnauthorizedException();
    }

    if (!memberId || !serverId) {
      throw new BadRequestException();
    }

    return await this.prismaService.server.update({
      where: {
        id: serverId,
        userId: userId,
      },
      data: {
        members: {
          update: {
            where: {
              id: memberId,
              userId: {
                not: userId,
              },
            },
            data: {
              role,
            },
          },
        },
      },
      include: {
        members: {
          include: {
            user: true,
          },
          orderBy: {
            role: 'asc',
          },
        },
      },
    });
  }
}
