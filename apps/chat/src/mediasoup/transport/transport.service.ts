import { Injectable, Logger } from '@nestjs/common';
import { RoomService } from '../room/room.service';
import { ITransportOptions } from './transport.interface';
import { WebRtcTransport } from 'mediasoup/node/lib/types';
import { webRtcTransport_options } from '../media.config';

@Injectable()
export class TransportService {
  private readonly logger = new Logger(TransportService.name);

  constructor(private readonly roomService: RoomService) {}

  public async createWebRtcTransport(
    roomId: string,
    peerId: string,
    direction: 'send' | 'recv',
  ): Promise<ITransportOptions> {
    this.logger.log(
      `Creating ${direction} transport for peer ${peerId} in room ${roomId}`,
    );

    try {
      const room = this.roomService.getRoom(roomId);
      if (!room) {
        this.logger.error(`Room ${roomId} not found`);
        throw new Error(`Room ${roomId} not found`);
      }

      const transport = await room.router.router.createWebRtcTransport({
        ...webRtcTransport_options,
        appData: { peerId, clientDirection: direction },
      });

      await transport.setMaxIncomingBitrate(1_500_000);

      this.roomService.addPeerToRoom(roomId, peerId);
      const peer = room.peers.get(peerId)!;
      peer.transports.set(transport.id, { transport });

      this.logger.log(`Transport ${transport.id} created for peer ${peerId}`);

      return {
        id: transport.id,
        iceParameters: transport.iceParameters,
        iceCandidates: transport.iceCandidates,
        dtlsParameters: transport.dtlsParameters,
      };
    } catch (error) {
      this.logger.error(
        `Transport creation failed: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }
}
