import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  ConnectedSocket,
  MessageBody,
  OnGatewayInit,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';

import { JoinChannelDto } from './dto/join-channel.dto';
import { RoomService } from './mediasoup/room/room.service';
import { TransportService } from './mediasoup/transport/transport.service';
import { ProducerConsumerService } from './mediasoup/producer-consumer/producer-consumer.service';

interface UserSession {
  channelId: string;
  username: string;
  avatar: string;
}

@WebSocketGateway({
  cors: { origin: process.env.CLIENT_URL, credentials: true },
  path: '/socket/io',
  addTrailingSlash: false,
})
export class ChatGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private userSessions = new Map<string, UserSession>();
  private readonly logger = new Logger(ChatGateway.name);

  constructor(
    private readonly roomService: RoomService,
    private readonly transportService: TransportService,
    private readonly producerConsumerService: ProducerConsumerService,
  ) {}

  afterInit() {
    this.logger.log('WebSocket server initialized');
  }

  handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);
  }

  async handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnecting: ${client.id}`);
    await this.handleLeaveRoom(client);
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  @SubscribeMessage('join-room')
  async handleJoinChannel(
    @MessageBody() dto: JoinChannelDto,
    @ConnectedSocket() client: Socket,
  ) {
    const { roomId, peerId, username, avatar } = dto;
    this.logger.log(
      `Join room request: roomId=${roomId}, peerId=${peerId}, username=${username}`,
    );

    try {
      const room = await this.roomService.createRoom(roomId);
      this.logger.debug(`Room ${roomId} created/fetched`);

      const [sendTransportOptions, recvTransportOptions] = await Promise.all([
        this.transportService.createWebRtcTransport(
          roomId,
          peerId,
          'send',
          username,
        ),
        this.transportService.createWebRtcTransport(
          roomId,
          peerId,
          'recv',
          username,
        ),
      ]);

      client.join(roomId);
      this.userSessions.set(client.id, { channelId: roomId, username, avatar });
      this.logger.log(`Client ${client.id} joined room ${roomId}`);

      this.server.emit('userJoined', { channelId: roomId, username, avatar });

      const peerIds = Array.from(room.peers.keys());
      const existingProducers = this.getExistingProducers(room, peerId);

      client.emit('update-peer-list', { peerIds });
      client.to(roomId).emit('new-peer', { peerId });

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

  private getExistingProducers(room, peerId: string) {
    const existingProducers = [];
    for (const [otherPeerId, peer] of room.peers) {
      if (otherPeerId !== peerId) {
        for (const producer of peer.producers.values()) {
          existingProducers.push({
            producerId: producer.producer.id,
            peerId: otherPeerId,
            kind: producer.producer.kind,
            username: peer.username,
          });
        }
      }
    }
    return existingProducers;
  }

  @SubscribeMessage('leave-room')
  async handleLeaveRoom(@ConnectedSocket() client: Socket) {
    this.logger.log(`Leave room request from ${client.id}`);
    const rooms = Array.from(client.rooms);

    const session = this.userSessions.get(client.id);
    if (session) {
      const { channelId, username } = session;
      this.userSessions.delete(client.id);
      this.server.emit('userLeft', { channelId, username });
      this.logger.log(`User ${username} left channel ${channelId}`);
    }

    for (const roomId of rooms) {
      if (roomId !== client.id) {
        const room = this.roomService.getRoom(roomId);
        if (room) {
          this.cleanupPeerResources(client, room);
          client.to(roomId).emit('peer-left', { peerId: client.id });
          client.leave(roomId);
          this.logger.log(`Client ${client.id} left room ${roomId}`);

          if (room.peers.size === 0) {
            this.roomService.removeRoom(roomId);
            this.logger.log(`Room ${roomId} removed`);
          }
        }
      }
    }

    return { participants: Array.from(this.userSessions.values()) };
  }

  private cleanupPeerResources(client: Socket, room) {
    const peer = room.peers.get(client.id);
    if (peer) {
      this.logger.log(`Cleaning resources for peer ${client.id}`);
      peer.producers.forEach((producer) => producer.producer.close());
      peer.consumers.forEach((consumer) => consumer.consumer.close());
      peer.transports.forEach((transport) => transport.transport.close());
      room.peers.delete(client.id);
    }
  }

  @SubscribeMessage('connect-transport')
  async handleConnectTransport(
    @MessageBody() data,
    @ConnectedSocket() client: Socket,
  ) {
    this.logger.log(`Connect transport request: ${JSON.stringify(data)}`);
    const { roomId, peerId, dtlsParameters, transportId } = data;

    try {
      const room = this.roomService.getRoom(roomId);
      const peer = room?.peers.get(peerId);

      if (!peer) {
        this.logger.warn(`Peer ${peerId} not found in room ${roomId}`);
        return { error: 'Peer not found' };
      }

      const transportData = peer.transports.get(transportId);
      if (!transportData) {
        this.logger.warn(
          `Transport ${transportId} not found for peer ${peerId}`,
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
  async handleProduce(@MessageBody() data, @ConnectedSocket() client: Socket) {
    this.logger.log(`Produce request: ${JSON.stringify(data)}`);
    const { roomId, peerId, username, kind, transportId, rtpParameters } = data;

    try {
      const producerId = await this.producerConsumerService.createProducer({
        roomId,
        peerId,
        transportId,
        kind,
        rtpParameters,
      });

      this.logger.log(`Producer created: ${producerId}`);
      client
        .to(roomId)
        .emit('new-producer', { producerId, peerId, username, kind });

      return { producerId };
    } catch (error) {
      this.logger.error(`Produce failed: ${error.message}`, error.stack);
      client.emit('produce-error', { error: error.message });
      return { error: error.message };
    }
  }

  @SubscribeMessage('consume')
  async handleConsume(@MessageBody() data, @ConnectedSocket() client: Socket) {
    this.logger.log(`Consume request: ${JSON.stringify(data)}`);
    const { roomId, peerId, producerId, rtpCapabilities, transportId } = data;

    try {
      const consumerData = await this.producerConsumerService.createConsumer({
        roomId,
        peerId,
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

  @SubscribeMessage('getParticipants')
  handleGetParticipants(
    @MessageBody() data: { channelId: string },
    @ConnectedSocket() client: Socket,
  ) {
    this.logger.log(`Get participants for channel ${data.channelId}`);
    const participants = Array.from(this.userSessions.values());
    return { status: 'ok', participants };
  }

  @SubscribeMessage('producer-pause')
  async handleProducerPause(
    @MessageBody() { roomId, producerId },
    @ConnectedSocket() client: Socket,
  ) {
    const peer = this.roomService.getRoom(roomId).peers.get(client.id);
    const pc = peer?.producers.get(producerId);
    if (pc) {
      await pc.producer.pause();
      this.server
        .to(roomId)
        .emit('producer-paused', { producerId, peerId: client.id });
    }
  }

  @SubscribeMessage('producer-resume')
  async handleProducerResume(
    @MessageBody() { roomId, producerId },
    @ConnectedSocket() client: Socket,
  ) {
    const peer = this.roomService.getRoom(roomId).peers.get(client.id);
    const pc = peer?.producers.get(producerId);
    if (pc) {
      await pc.producer.resume();
      this.server
        .to(roomId)
        .emit('producer-resumed', { producerId, peerId: client.id });
    }
  }
}
