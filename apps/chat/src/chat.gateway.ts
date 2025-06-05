import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  ConnectedSocket,
  MessageBody,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger, UseGuards } from '@nestjs/common';

import { RoomService } from './mediasoup/room/room.service';
import { TransportService } from './mediasoup/transport/transport.service';
import { ProducerConsumerService } from './mediasoup/producer-consumer/producer-consumer.service';
import { IRoom } from './mediasoup/room/room.interface';
import { User } from '@prisma/db-auth';
import { types } from 'mediasoup';
import { CurrentUser, JwtSocketGuard } from '@app/core-lib';

interface UserSession {
  socketId: string;
  roomId: string;
  username: string;
  avatar: string;
}

@UseGuards(JwtSocketGuard)
@WebSocketGateway({
  cors: { origin: process.env.CLIENT_URL, credentials: true },
  path: '/socket/io',
  addTrailingSlash: false,
})
export class ChatGateway implements OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private userSessions = new Map<string, UserSession>();
  private readonly logger = new Logger(ChatGateway.name);

  constructor(
    private readonly roomService: RoomService,
    private readonly transportService: TransportService,
    private readonly producerConsumerService: ProducerConsumerService,
  ) {}

  async handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnecting: ${client.id}`);
    await this.handleLeaveRoom(client);
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  @SubscribeMessage('join-room')
  async handleJoinChannel(
    @MessageBody() data: { roomId: string },
    @ConnectedSocket() client: Socket,
    @CurrentUser() user: User,
  ) {
    const roomId = data.roomId;
    this.logger.log(
      `Join room request: roomId=${roomId}, peerId=${user.id}, username=${user.name}`,
    );

    try {
      const room = await this.roomService.createRoom(roomId);
      this.logger.debug(`Room ${roomId} created/fetched`);

      const [sendTransportOptions, recvTransportOptions] = await Promise.all([
        this.transportService.createWebRtcTransport(roomId, user.id, 'send'),
        this.transportService.createWebRtcTransport(roomId, user.id, 'recv'),
      ]);

      client.join(roomId);

      if (this.userSessions.has(user.id)) {
        const existingSession = this.userSessions.get(user.id);
        const oldClient = this.server.sockets.sockets.get(
          existingSession.socketId,
        );
        if (oldClient) {
          oldClient.disconnect(true);
        }
      }
      this.userSessions.set(user.id, {
        socketId: client.id,
        roomId,
        username: user.name,
        avatar: user.imageUrl,
      });

      this.logger.log(`Client ${user.name} joined room ${roomId}`);

      client.to(roomId).emit('user-joined', {
        roomId,
        username: user.name,
        avatar: user.imageUrl,
      });

      this.server.to(roomId).emit('user-joined', {
        roomId,
        username: user.name,
        avatar: user.imageUrl,
      });

      const peerIds = Array.from(room.peers.keys());
      const existingProducers = this.getExistingProducers(room, user.id);

      client.emit('update-peer-list', { peerIds });
      client.to(roomId).emit('new-peer', { peerId: user.id });

      const participants = Array.from(this.userSessions.values());
      this.logger.log(
        `Room ${roomId} now has ${participants.length} participants`,
      );

      return {
        sendTransportOptions,
        recvTransportOptions,
        rtpCapabilities: room.router.router.rtpCapabilities,
        peerIds,
        existingProducers,
        participants,
      };
    } catch (error) {
      this.logger.error(`Join room failed: ${error.message}`, error.stack);
      client.emit('join-room-error', { error: error.message });
      return { error: error.message };
    }
  }

  private getExistingProducers(room: IRoom, peerId: string) {
    const existingProducers = [];
    for (const [otherPeerId, peer] of room.peers) {
      if (otherPeerId !== peerId) {
        for (const producer of peer.producers.values()) {
          existingProducers.push({
            producerId: producer.producer.id,
            peerId: otherPeerId,
            kind: producer.producer.kind,
          });
        }
      }
    }
    return existingProducers;
  }

  @SubscribeMessage('leave-room')
  async handleLeaveRoom(@ConnectedSocket() client: Socket) {
    let peerId: string | null = null;
    for (const [userId, session] of this.userSessions.entries()) {
      if (session.socketId === client.id) {
        peerId = userId;
        break;
      }
    }

    this.logger.log(`Leave room request from ${peerId}`);
    const rooms = Array.from(client.rooms);

    if (peerId) {
      const session = this.userSessions.get(peerId);
      if (session) {
        const { roomId, username } = session;
        this.userSessions.delete(peerId);
        this.server.emit('user-left', { channelId: roomId, username });
        this.logger.log(`User ${username} disconnected from room ${roomId}`);
      }
    }

    for (const roomId of rooms) {
      if (roomId !== client.id) {
        const room = this.roomService.getRoom(roomId);
        if (room) {
          this.cleanupPeerResources(room, peerId);
          client.to(roomId).emit('peer-left', { peerId });
          client.leave(roomId);
          this.logger.log(`Client ${peerId} left room ${roomId}`);

          if (room.peers.size === 0) {
            this.roomService.removeRoom(roomId);
            this.logger.log(`Room ${roomId} removed`);
          }
        }
      }
    }

    return { participants: Array.from(this.userSessions.values()) };
  }

  private cleanupPeerResources(room: IRoom, peerId: string) {
    const peer = room.peers.get(peerId);
    if (peer) {
      this.logger.log(`Cleaning resources for peer ${peerId}`);
      peer.producers.forEach((producer) => producer.producer.close());
      peer.consumers.forEach((consumer) => consumer.consumer.close());
      peer.transports.forEach((transport) => transport.transport.close());
      room.peers.delete(peerId);
    }
  }

  @SubscribeMessage('connect-transport')
  async handleConnectTransport(
    @MessageBody()
    data: {
      roomId: string;
      dtlsParameters: types.DtlsParameters;
      transportId: string;
    },
    @ConnectedSocket() client: Socket,
    @CurrentUser('id') userId: string,
  ) {
    this.logger.log(`Connect transport request: ${JSON.stringify(data)}`);
    const { roomId, dtlsParameters, transportId } = data;

    try {
      const room = this.roomService.getRoom(roomId);
      const peer = room?.peers.get(userId);

      if (!peer) {
        this.logger.warn(`Peer ${userId} not found in room ${roomId}`);
        return { error: 'Peer not found' };
      }

      const transportData = peer.transports.get(transportId);
      if (!transportData) {
        this.logger.warn(
          `Transport ${transportId} not found for peer ${userId}`,
        );
        return { error: 'Transport not found' };
      }

      await transportData.transport.connect({ dtlsParameters });
      this.logger.log(`Transport ${transportId} connected successfully`);

      return { connected: true };
    } catch (error) {
      this.logger.error(
        `Transport connect failed: ${error.message}`,
        error.stack,
      );
      return { error: error.message };
    }
  }

  @SubscribeMessage('produce')
  async handleProduce(
    @MessageBody()
    data: {
      roomId: string;
      kind: types.MediaKind;
      transportId: string;
      rtpParameters: types.RtpParameters;
    },
    @ConnectedSocket() client: Socket,
    @CurrentUser() user: User,
  ) {
    this.logger.log(`Produce request: ${JSON.stringify(data)}`);
    const { roomId, kind, transportId, rtpParameters } = data;

    try {
      const producerId = await this.producerConsumerService.createProducer({
        roomId,
        peerId: user.id,
        transportId,
        kind,
        rtpParameters,
      });

      this.logger.log(`Producer created: ${producerId}`);
      client.to(roomId).emit('new-producer', {
        producerId,
        peerId: user.id,
        username: user.name,
        kind,
      });

      return { producerId };
    } catch (error) {
      this.logger.error(`Produce failed: ${error.message}`, error.stack);
      client.emit('produce-error', { error: error.message });
      return { error: error.message };
    }
  }

  @SubscribeMessage('consume')
  async handleConsume(
    @MessageBody()
    data: {
      roomId: string;
      producerId: string;
      rtpCapabilities: types.RtpCapabilities;
      transportId: string;
    },
    @ConnectedSocket() client: Socket,
    @CurrentUser('id') userId: string,
  ) {
    this.logger.log(`Consume request: ${JSON.stringify(data)}`);
    const { roomId, producerId, rtpCapabilities, transportId } = data;

    try {
      const consumerData = await this.producerConsumerService.createConsumer({
        roomId,
        peerId: userId,
        transportId,
        producerId,
        rtpCapabilities,
      });

      this.logger.log(`Consumer created for producer ${producerId}`);
      return { consumerData };
    } catch (error) {
      this.logger.error(`Consume failed: ${error.message}`, error.stack);
      client.emit('consume-error', { error: error.message });
      return { error: error.message };
    }
  }

  @SubscribeMessage('get-participants')
  handleGetParticipants(
    @MessageBody() channelId: string,
    @ConnectedSocket() client: Socket,
  ) {
    this.logger.log(`Get participants for channel ${channelId}`);
    const participants = Array.from(this.userSessions.values());
    return { status: 'ok', participants };
  }

  @SubscribeMessage('producer-pause')
  async handleProducerPause(
    @MessageBody() data: { roomId: string; producerId: string },
    @ConnectedSocket() client: Socket,
    @CurrentUser('id') userId: string,
  ) {
    const { roomId, producerId } = data;
    const peer = this.roomService.getRoom(roomId).peers.get(userId);
    const pc = peer?.producers.get(producerId);
    if (pc) {
      await pc.producer.pause();
      this.server.to(roomId).emit('producer-paused', { producerId });
    }
  }

  @SubscribeMessage('producer-resume')
  async handleProducerResume(
    @MessageBody() data: { roomId: string; producerId: string },
    @ConnectedSocket() client: Socket,
    @CurrentUser('id') userId: string,
  ) {
    const { roomId, producerId } = data;
    const peer = this.roomService.getRoom(roomId).peers.get(userId);
    const pc = peer?.producers.get(producerId);
    if (pc) {
      await pc.producer.resume();
      this.server.to(roomId).emit('producer-resumed', { producerId });
    }
  }

  @SubscribeMessage('producer-close')
  async handleProducerClose(
    @MessageBody() data: { roomId: string; producerId: string },
    @ConnectedSocket() client: Socket,
    @CurrentUser('id') userId: string,
  ) {
    const { roomId, producerId } = data;
    const peer = this.roomService.getRoom(roomId).peers.get(userId);
    console.log('peer = ', peer);
    console.log('roomId, producerId - ', roomId, producerId);
    const pc = peer?.producers.get(producerId);
    console.log('pc - ', pc);
    if (pc) {
      console.log('if work');
      await pc.producer.close();
      peer.producers.delete(producerId);
    }
    this.server.to(roomId).emit('producer-closed', { producerId });
  }
}
