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
import { ProducerEventDto } from './dto/producer-event.dto';

interface UserSession {
  roomId: string;
  username: string;
  avatar: string;
  socketId: string;
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
    const context = `handleDisconnect`;
    this.logger.log(`[${context}] Client disconnecting`, {
      clientId: client.id,
      timestamp: new Date().toISOString(),
    });

    try {
      await this.handleLeaveRoom(client);
      this.logger.log(`[${context}] Client successfully disconnected`, {
        clientId: client.id,
      });
    } catch (error) {
      this.logger.error(`[${context}] Error during client disconnect`, {
        clientId: client.id,
        error: error.message,
        stack: error.stack,
      });
    }
  }

  @SubscribeMessage('join-room')
  async handleJoinChannel(
    @MessageBody() data: { roomId: string },
    @ConnectedSocket() client: Socket,
    @CurrentUser() user: User,
  ) {
    const context = `handleJoinChannel`;
    const { roomId } = data;

    this.logger.log(`[${context}] Join room request received`, {
      roomId,
      userId: user.id,
      username: user.name,
      clientId: client.id,
    });

    try {
      const room = await this.roomService.createRoom(roomId);
      this.logger.debug(`[${context}] Room created/fetched successfully`, {
        roomId,
        peersCount: room.peers.size,
      });

      const [sendTransportOptions, recvTransportOptions] = await Promise.all([
        this.transportService.createWebRtcTransport(roomId, user.id, 'send'),
        this.transportService.createWebRtcTransport(roomId, user.id, 'recv'),
      ]);

      this.logger.debug(`[${context}] WebRTC transports created`, {
        roomId,
        userId: user.id,
        sendTransportId: sendTransportOptions.id,
        recvTransportId: recvTransportOptions.id,
      });

      client.join(roomId);

      if (this.userSessions.has(user.id)) {
        const existingSession = this.userSessions.get(user.id);
        this.logger.warn(
          `[${context}] User already has active session, disconnecting old one`,
          {
            userId: user.id,
            oldSocketId: existingSession.socketId,
            newSocketId: client.id,
          },
        );

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

      this.logger.log(`[${context}] User successfully joined room`, {
        userId: user.id,
        username: user.name,
        roomId,
        clientId: client.id,
      });

      const userJoinedPayload = {
        roomId,
        username: user.name,
        avatar: user.imageUrl,
        userId: user.id,
      };

      client.to(roomId).emit('user-joined', userJoinedPayload);
      this.server.emit('user-joined', userJoinedPayload);

      const peerIds = Array.from(room.peers.keys());
      const existingProducers = this.getExistingProducers(room, user.id);
      
      const participants = Array.from(this.userSessions.entries())
        .filter(([_, session]) => session.roomId === roomId)
        .map(([userId, session]) => ({
          channelId: session.roomId,
          username: session.username,
          avatar: session.avatar,
          userId,
        }));

      this.logger.debug(`[${context}] Sending response data`, {
        roomId,
        userId: user.id,
        peersCount: peerIds.length,
        existingProducersCount: existingProducers.length,
        participantsCount: participants.length,
      });

      client.emit('update-peer-list', { peerIds });
      client.to(roomId).emit('new-peer', { peerId: user.id });

      this.logger.log(`[${context}] Room state updated`, {
        roomId,
        totalParticipants: participants.length,
        totalPeers: peerIds.length,
      });

      return {
        sendTransportOptions,
        recvTransportOptions,
        rtpCapabilities: room.router.router.rtpCapabilities,
        peerIds,
        existingProducers,
        participants,
      };
    } catch (error) {
      this.logger.error(`[${context}] Join room operation failed`, {
        roomId,
        userId: user.id,
        clientId: client.id,
        error: error.message,
        stack: error.stack,
      });

      client.emit('join-room-error', { error: error.message });
      return { error: error.message };
    }
  }

  private getExistingProducers(room: IRoom, peerId: string) {
    const context = `getExistingProducers`;
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

    this.logger.debug(`[${context}] Found existing producers`, {
      requestingPeerId: peerId,
      existingProducersCount: existingProducers.length,
      producers: existingProducers.map((p) => ({
        producerId: p.producerId,
        peerId: p.peerId,
        kind: p.kind,
      })),
    });

    return existingProducers;
  }

  @SubscribeMessage('leave-room')
  async handleLeaveRoom(@ConnectedSocket() client: Socket) {
    const context = `handleLeaveRoom`;
    let peerId: string | null = null;

    for (const [userId, session] of this.userSessions.entries()) {
      if (session.socketId === client.id) {
        peerId = userId;
        break;
      }
    }

    this.logger.log(`[${context}] Leave room request`, {
      clientId: client.id,
      peerId,
    });

    const rooms = Array.from(client.rooms);
    let roomId: string | null = null;

    try {
      if (peerId) {
        const session = this.userSessions.get(peerId);
        if (session) {
          roomId = session.roomId;
          const { username } = session;

          this.userSessions.delete(peerId);

          this.logger.log(`[${context}] User session removed`, {
            peerId,
            username,
            roomId,
          });

          this.server.emit('user-left', {
            channelId: roomId,
            username,
            userId: peerId,
          });
        }
      }

      for (const currentRoomId of rooms) {
        if (currentRoomId !== client.id) {
          const room = this.roomService.getRoom(currentRoomId);
          if (room && peerId) {
            this.logger.debug(`[${context}] Cleaning up peer resources`, {
              roomId: currentRoomId,
              peerId,
            });

            this.cleanupPeerResources(room, peerId);
            client.to(currentRoomId).emit('peer-left', { peerId });
            client.leave(currentRoomId);

            this.logger.log(`[${context}] Peer left room`, {
              roomId: currentRoomId,
              peerId,
              remainingPeers: room.peers.size,
            });

            if (room.peers.size === 0) {
              this.roomService.removeRoom(currentRoomId);
              this.logger.log(`[${context}] Empty room removed`, {
                roomId: currentRoomId,
              });
            }
          }
        }
      }

      const participants = Array.from(this.userSessions.values());

      this.logger.log(`[${context}] Leave room completed`, {
        peerId,
        roomId,
        totalParticipants: participants.length,
      });

      return { participants };
    } catch (error) {
      this.logger.error(`[${context}] Error during leave room`, {
        clientId: client.id,
        peerId,
        roomId,
        error: error.message,
        stack: error.stack,
      });

      return { error: error.message };
    }
  }

  private cleanupPeerResources(room: IRoom, peerId: string) {
    const context = `cleanupPeerResources`;
    const peer = room.peers.get(peerId);

    if (peer) {
      this.logger.debug(`[${context}] Starting cleanup for peer`, {
        peerId,
        producersCount: peer.producers.size,
        consumersCount: peer.consumers.size,
        transportsCount: peer.transports.size,
      });

      try {
        peer.producers.forEach((producer, producerId) => {
          producer.producer.close();
          this.logger.debug(`[${context}] Producer closed`, {
            peerId,
            producerId,
          });
        });

        peer.consumers.forEach((consumer, consumerId) => {
          consumer.consumer.close();
          this.logger.debug(`[${context}] Consumer closed`, {
            peerId,
            consumerId,
          });
        });

        peer.transports.forEach((transport, transportId) => {
          transport.transport.close();
          this.logger.debug(`[${context}] Transport closed`, {
            peerId,
            transportId,
          });
        });

        room.peers.delete(peerId);

        this.logger.log(`[${context}] Peer resources cleaned up successfully`, {
          peerId,
        });
      } catch (error) {
        this.logger.error(`[${context}] Error during resource cleanup`, {
          peerId,
          error: error.message,
          stack: error.stack,
        });
      }
    } else {
      this.logger.warn(`[${context}] Peer not found for cleanup`, {
        peerId,
      });
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
    const context = `handleConnectTransport`;
    const { roomId, dtlsParameters, transportId } = data;

    this.logger.log(`[${context}] Connect transport request`, {
      roomId,
      userId,
      transportId,
      clientId: client.id,
    });

    try {
      const room = this.roomService.getRoom(roomId);
      if (!room) {
        this.logger.warn(`[${context}] Room not found`, {
          roomId,
          userId,
        });
        return { error: 'Room not found' };
      }

      const peer = room.peers.get(userId);
      if (!peer) {
        this.logger.warn(`[${context}] Peer not found in room`, {
          roomId,
          userId,
        });
        return { error: 'Peer not found' };
      }

      const transportData = peer.transports.get(transportId);
      if (!transportData) {
        this.logger.warn(`[${context}] Transport not found for peer`, {
          roomId,
          userId,
          transportId,
        });
        return { error: 'Transport not found' };
      }

      await transportData.transport.connect({ dtlsParameters });

      this.logger.log(`[${context}] Transport connected successfully`, {
        roomId,
        userId,
        transportId,
      });

      return { connected: true };
    } catch (error) {
      this.logger.error(`[${context}] Transport connect failed`, {
        roomId,
        userId,
        transportId,
        error: error.message,
        stack: error.stack,
      });
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
    const context = `handleProduce`;
    const { roomId, kind, transportId, rtpParameters } = data;

    this.logger.log(`[${context}] Produce request`, {
      roomId,
      userId: user.id,
      username: user.name,
      kind,
      transportId,
      clientId: client.id,
    });

    try {
      const producerId = await this.producerConsumerService.createProducer({
        roomId,
        peerId: user.id,
        transportId,
        kind,
        rtpParameters,
      });

      this.logger.log(`[${context}] Producer created successfully`, {
        roomId,
        userId: user.id,
        username: user.name,
        producerId,
        kind,
      });

      client.to(roomId).emit('new-producer', {
        producerId,
        peerId: user.id,
        username: user.name,
        kind,
      });

      return { producerId };
    } catch (error) {
      this.logger.error(`[${context}] Produce operation failed`, {
        roomId,
        userId: user.id,
        kind,
        transportId,
        error: error.message,
        stack: error.stack,
      });

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
    const context = `handleConsume`;
    const { roomId, producerId, rtpCapabilities, transportId } = data;

    this.logger.log(`[${context}] Consume request`, {
      roomId,
      userId,
      producerId,
      transportId,
      clientId: client.id,
    });

    try {
      const consumerData = await this.producerConsumerService.createConsumer({
        roomId,
        peerId: userId,
        transportId,
        producerId,
        rtpCapabilities,
      });

      this.logger.log(`[${context}] Consumer created successfully`, {
        roomId,
        userId,
        producerId,
        consumerId: consumerData.id,
      });

      return { consumerData };
    } catch (error) {
      this.logger.error(`[${context}] Consume operation failed`, {
        roomId,
        userId,
        producerId,
        transportId,
        error: error.message,
        stack: error.stack,
      });

      client.emit('consume-error', { error: error.message });
      return { error: error.message };
    }
  }

  @SubscribeMessage('get-participants')
  handleGetParticipants(
    @MessageBody() channelId: string,
    @ConnectedSocket() client: Socket,
  ) {
    const context = `handleGetParticipants`;

    this.logger.log(`[${context}] Get participants request`, {
      channelId,
      clientId: client.id,
    });

    const participants = Array.from(this.userSessions.entries())
      .filter(([_, session]) => session.roomId === channelId)
      .map(([userId, session]) => ({
        channelId: session.roomId,
        username: session.username,
        avatar: session.avatar,
        userId,
      }));

    this.logger.debug(`[${context}] Participants found`, {
      channelId,
      participantsCount: participants.length,
    });

    return { status: 'ok', participants };
  }

  @SubscribeMessage('producer-pause')
  async handleProducerPause(
    @MessageBody() data: ProducerEventDto,
    @ConnectedSocket() client: Socket,
    @CurrentUser('id') userId: string,
  ) {
    const context = `handleProducerPause`;
    const { roomId, producerId } = data;

    this.logger.log(`[${context}] Producer pause request`, {
      roomId,
      userId,
      producerId,
      clientId: client.id,
    });

    try {
      const room = this.roomService.getRoom(roomId);
      if (!room) {
        this.logger.warn(`[${context}] Room not found`, { roomId, userId });
        return { error: 'Room not found' };
      }

      const peer = room.peers.get(userId);
      if (!peer) {
        this.logger.warn(`[${context}] Peer not found`, { roomId, userId });
        return { error: 'Peer not found' };
      }

      const pc = peer.producers.get(producerId);
      if (!pc) {
        this.logger.warn(`[${context}] Producer not found`, {
          roomId,
          userId,
          producerId,
        });
        return { error: 'Producer not found' };
      }

      await pc.producer.pause();

      this.logger.log(`[${context}] Producer paused successfully`, {
        roomId,
        userId,
        producerId,
      });

      this.server.to(roomId).emit('producer-paused', { producerId });

      return { success: true };
    } catch (error) {
      this.logger.error(`[${context}] Producer pause failed`, {
        roomId,
        userId,
        producerId,
        error: error.message,
        stack: error.stack,
      });
      return { error: error.message };
    }
  }

  @SubscribeMessage('producer-resume')
  async handleProducerResume(
    @MessageBody() data: ProducerEventDto,
    @ConnectedSocket() client: Socket,
    @CurrentUser('id') userId: string,
  ) {
    const context = `handleProducerResume`;
    const { roomId, producerId } = data;

    this.logger.log(`[${context}] Producer resume request`, {
      roomId,
      userId,
      producerId,
      clientId: client.id,
    });

    try {
      const room = this.roomService.getRoom(roomId);
      if (!room) {
        this.logger.warn(`[${context}] Room not found`, { roomId, userId });
        return { error: 'Room not found' };
      }

      const peer = room.peers.get(userId);
      if (!peer) {
        this.logger.warn(`[${context}] Peer not found`, { roomId, userId });
        return { error: 'Peer not found' };
      }

      const pc = peer.producers.get(producerId);
      if (!pc) {
        this.logger.warn(`[${context}] Producer not found`, {
          roomId,
          userId,
          producerId,
        });
        return { error: 'Producer not found' };
      }

      await pc.producer.resume();

      this.logger.log(`[${context}] Producer resumed successfully`, {
        roomId,
        userId,
        producerId,
      });

      this.server.to(roomId).emit('producer-resumed', { producerId });

      return { success: true };
    } catch (error) {
      this.logger.error(`[${context}] Producer resume failed`, {
        roomId,
        userId,
        producerId,
        error: error.message,
        stack: error.stack,
      });
      return { error: error.message };
    }
  }

  @SubscribeMessage('producer-close')
  async handleProducerClose(
    @MessageBody() data: ProducerEventDto,
    @ConnectedSocket() client: Socket,
    @CurrentUser('id') userId: string,
  ) {
    const context = `handleProducerClose`;
    const { roomId, producerId } = data;

    this.logger.log(`[${context}] Producer close request`, {
      roomId,
      userId,
      producerId,
      clientId: client.id,
    });

    try {
      const room = this.roomService.getRoom(roomId);
      if (!room) {
        this.logger.warn(`[${context}] Room not found`, { roomId, userId });
        return { error: 'Room not found' };
      }

      const peer = room.peers.get(userId);
      if (!peer) {
        this.logger.warn(`[${context}] Peer not found`, { roomId, userId });
        return { error: 'Peer not found' };
      }

      const pc = peer.producers.get(producerId);
      if (!pc) {
        this.logger.warn(`[${context}] Producer not found`, {
          roomId,
          userId,
          producerId,
        });
        return { error: 'Producer not found' };
      }

      await pc.producer.close();
      peer.producers.delete(producerId);

      this.logger.log(`[${context}] Producer closed successfully`, {
        roomId,
        userId,
        producerId,
      });

      this.server.to(roomId).emit('producer-closed', { producerId });

      return { success: true };
    } catch (error) {
      this.logger.error(`[${context}] Producer close failed`, {
        roomId,
        userId,
        producerId,
        error: error.message,
        stack: error.stack,
      });
      return { error: error.message };
    }
  }
}
