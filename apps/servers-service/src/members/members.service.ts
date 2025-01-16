import { BadRequestException, Injectable, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '@app/database';
import { UpdateMemberDto } from './dto/update-member.dto';

@Injectable()
export class MembersService {

  constructor(private readonly prismaService: PrismaService) {}

  async delete(
    req: Request,
    memberId: string,
    userId: string
  ) {
    const { searchParams } = new URL(req.url);
		const serverId = searchParams.get("serverId");

    if (!userId) {
      throw new UnauthorizedException();
    }

    if (!memberId || !serverId) {
      throw new BadRequestException();
    }

    return await this.prismaService.server.update({
			where: {
				id: serverId,
				userId: userId
			},
			data: {
				members: {
					deleteMany: {
						id: memberId,
						userId: {
							not: userId,
						}
					}
				}
			},
			include: {
				members: {
					include: {
						user: true,
					},
					orderBy: {
						role: "asc",
					},
				},
			},
    });
  }

  async update(
    req: Request,
    memberId: string,
    userId: string,
    { role }: UpdateMemberDto,
  ) {
    const { searchParams } = new URL(req.url);
		const serverId = searchParams.get("serverId");

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
								not: userId
							}
						},
						data: {
							role
						}
					}
				}
			},
			include: {
				members: {
					include: {
						user: true,
					},
					orderBy: {
						role: "asc",
					}
				}
			}
		});
  }
}
