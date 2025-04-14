import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayDisconnect,
  SubscribeMessage,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { createWebRtcTransport } from './utils/mediasoup.config';

@WebSocketGateway({
  cors: {
    origin: process.env.CLIENT_URL,
    credentials: true,
  },
  path: '/socket/io',
  addTrailingSlash: false,
})
export class ChatGateway implements OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private rooms: Map<string, Set<string>> = new Map();

  handleDisconnect(client: Socket) {
    this.rooms.forEach((participants, roomId) => {
      if (participants.has(client.id)) {
        participants.delete(client.id);
        client.to(roomId).emit('participantLeft', client.id);
      }
    });
  }

  @SubscribeMessage('joinRoom')
  async handleJoinRoom(
    client: Socket,
    payload: {
      username: string;
      roomId: string;
    },
  ) {
    const { roomId, username } = payload;

    // Join the room
    client.join(roomId);
    if (!this.rooms.has(roomId)) {
      this.rooms.set(roomId, new Set());
    }
    this.rooms.get(roomId).add(client.id);

    // Create WebRTC transport
    try {
      const transport = await createWebRtcTransport();
      client.emit('transportCreated', {
        id: transport.id,
        iceParameters: transport.iceParameters,
        iceCandidates: transport.iceCandidates,
        dtlsParameters: transport.dtlsParameters,
      });

      // Notify others
      client.to(roomId).emit('newParticipant', {
        id: client.id,
        username,
      });
    } catch (error) {
      console.error('Error creating transport:', error);
      client.emit('error', 'Failed to create WebRTC transport');
    }
  }

  @SubscribeMessage('leaveRoom')
  handleLeaveRoom(client: Socket, payload: { roomId: string }) {
    const { roomId } = payload;
    client.leave(roomId);
    if (this.rooms.has(roomId)) {
      this.rooms.get(roomId).delete(client.id);
      client.to(roomId).emit('participantLeft', client.id);
    }
  }

  @SubscribeMessage('iceCandidate')
  handleIceCandidate(
    client: Socket,
    payload: { candidate: any; roomId: string },
  ) {
    client.to(payload.roomId).emit('iceCandidate', {
      candidate: payload.candidate,
      senderId: client.id,
    });
  }

  @SubscribeMessage('offer')
  handleOffer(
    client: Socket,
    payload: { offer: any; targetId: string; roomId: string },
  ) {
    client.to(payload.targetId).emit('offer', {
      offer: payload.offer,
      senderId: client.id,
    });
  }

  @SubscribeMessage('answer')
  handleAnswer(
    client: Socket,
    payload: { answer: any; targetId: string; roomId: string },
  ) {
    client.to(payload.targetId).emit('answer', {
      answer: payload.answer,
      senderId: client.id,
    });
  }

  @SubscribeMessage('screenShare')
  handleScreenShare(
    client: Socket,
    payload: { roomId: string; stream: MediaStream },
  ) {
    client.to(payload.roomId).emit('screenShared', {
      stream: payload.stream,
      senderId: client.id,
    });
  }

  @SubscribeMessage('stopScreenShare')
  handleStopScreenShare(client: Socket, payload: { roomId: string }) {
    client.to(payload.roomId).emit('screenShareStopped', {
      senderId: client.id,
    });
  }
}
