import { OnModuleInit, Logger } from '@nestjs/common';
import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  ConnectedSocket,
  MessageBody,
  WsException,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

import { types as mediasoupTypes } from 'mediasoup';
import { createWorker } from 'mediasoup';

import { mediasoupConfig } from './mediasoup/mediasoup.config';
import { Room } from './mediasoup/room.entity';
import { Peer } from './mediasoup/peer.entity';

@WebSocketGateway({
  cors: { origin: process.env.CLIENT_URL, credentials: true },
  path: '/socket/io',
  addTrailingSlash: false,
})
export class ChatGateway implements OnModuleInit {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(ChatGateway.name);
  private workers: mediasoupTypes.Worker[] = [];
  private nextWorkerIndex = 0;
  private roomList = new Map<string, Room>();

  async onModuleInit() {
    await this.createWorkers();
  }

  private async createWorkers() {
    const { numWorkers, worker: workerSettings } = mediasoupConfig.mediasoup;
    for (let i = 0; i < numWorkers; ++i) {
      const worker = await createWorker({
        logLevel: workerSettings.logLevel,
        logTags: workerSettings.logTags,
        rtcMinPort: workerSettings.rtcMinPort,
        rtcMaxPort: workerSettings.rtcMaxPort,
      });
      worker.on('died', () => {
        this.logger.error(
          `mediasoup Worker died [pid:${worker.pid}], exiting...`,
        );
        setTimeout(() => process.exit(1), 2000);
      });
      this.workers.push(worker);
    }
  }

  private getMediasoupWorker(): mediasoupTypes.Worker {
    const worker = this.workers[this.nextWorkerIndex];
    this.nextWorkerIndex = (this.nextWorkerIndex + 1) % this.workers.length;
    return worker;
  }

  @SubscribeMessage('createRoom')
  async handleCreateRoom(
    @ConnectedSocket() socket: Socket,
    @MessageBody() { room_id }: { room_id: string },
  ): Promise<string> {
    if (this.roomList.has(room_id)) {
      throw new WsException('Room already exists');
    }
    this.logger.log(`Created room ${room_id}`);
    const worker = await this.getMediasoupWorker();
    this.logger.log(`Get worker ${worker}`);
    const room = await Room.create(room_id, worker, this.server);
    console.log(`Create room ${room}`);
    this.roomList.set(room_id, room);
    console.log(`List rooms ${this.roomList}`);
    return room_id;
  }

  @SubscribeMessage('join')
  async handleJoin(
    @ConnectedSocket() socket: Socket,
    @MessageBody() { room_id, name }: { room_id: string; name: string },
  ) {
    if (!this.roomList.has(room_id)) {
      throw new WsException('Room does not exist');
    }
    const room = this.roomList.get(room_id);
    room.addPeer(new Peer(socket.id, name));
    socket.data.room_id = room_id;
    this.logger.log(`Join room ${room_id}`);
    return room.toJson();
  }

  @SubscribeMessage('getProducers')
  handleGetProducers(@ConnectedSocket() socket: Socket): void {
    const room = this.roomList.get(socket.data.room_id);
    if (!room) return;
    const list = room.getProducerListForPeer();
    this.logger.log(`Get producers ${list}`);
    socket.emit('newProducers', list);
  }

  @SubscribeMessage('getRouterRtpCapabilities')
  handleGetRtp(
    @ConnectedSocket() socket: Socket,
  ): mediasoupTypes.RtpCapabilities {
    this.logger.log(`Get RouterRtpCapabilities`, {
      name: `${this.roomList.get(socket.data.room_id).getPeers().get(socket.id).name}`,
    });
    const room = this.roomList.get(socket.data.room_id);
    if (!room) throw new WsException('Not in a room');
    return room.getRtpCapabilities();
  }

  @SubscribeMessage('createWebRtcTransport')
  async handleCreateTransport(@ConnectedSocket() socket: Socket) {
    this.logger.log(`Create WebRTC transport`, {
      name: `${this.roomList.get(socket.data.room_id).getPeers().get(socket.id).name}`,
    });
    const room = this.roomList.get(socket.data.room_id);
    if (!room) throw new WsException('Not in a room');
    const { params } = await room.createWebRtcTransport(socket.id);
    return params;
  }

  @SubscribeMessage('connectTransport')
  async handleConnectTransport(
    @ConnectedSocket() socket: Socket,
    @MessageBody()
    {
      transport_id,
      dtlsParameters,
    }: { transport_id: string; dtlsParameters: mediasoupTypes.DtlsParameters },
  ) {
    this.logger.log(`Connect transport`, {
      name: `${this.roomList.get(socket.data.room_id).getPeers().get(socket.id).name}`,
    });
    const room = this.roomList.get(socket.data.room_id);
    if (!room) throw new WsException('Not in a room');
    await room.connectPeerTransport(socket.id, transport_id, dtlsParameters);
  }

  @SubscribeMessage('produce')
  async handleProduce(
    @ConnectedSocket() socket: Socket,
    @MessageBody()
    {
      kind,
      rtpParameters,
      producerTransportId,
    }: {
      kind: mediasoupTypes.MediaKind;
      rtpParameters: mediasoupTypes.RtpParameters;
      producerTransportId: string;
    },
  ): Promise<string> {
    const room = this.roomList.get(socket.data.room_id);
    if (!room) throw new WsException('Not in a room');
    const producer_id = await room.produce(
      socket.id,
      producerTransportId,
      rtpParameters,
      kind,
    );
    this.logger.log(`Produce`, {
      type: `${kind}`,
      name: `${room.getPeers().get(socket.id).name}`,
      id: `${producer_id}`,
    });
    return producer_id;
  }

  @SubscribeMessage('consume')
  async handleConsume(
    @ConnectedSocket() socket: Socket,
    @MessageBody()
    {
      consumerTransportId,
      producerId,
      rtpCapabilities,
    }: {
      consumerTransportId: string;
      producerId: string;
      rtpCapabilities: mediasoupTypes.RtpCapabilities;
    },
  ) {
    const room = this.roomList.get(socket.data.room_id);
    if (!room) throw new WsException('Not in a room');
    const params = await room.consume(
      socket.id,
      consumerTransportId,
      producerId,
      rtpCapabilities,
    );
    this.logger.log(`Consume`, {
      name: `${room.getPeers().get(socket.id).name}`,
      producer_id: `${producerId}`,
      consumer_id: `${params.id}`,
    });
    return params;
  }

  @SubscribeMessage('producerClosed')
  handleProducerClosed(
    @ConnectedSocket() socket: Socket,
    @MessageBody() { producer_id }: { producer_id: string },
  ): void {
    this.logger.log(`Producer closed`, {
      name: `${this.roomList.get(socket.data.room_id).getPeers().get(socket.id).name}`,
    });
    const room = this.roomList.get(socket.data.room_id);
    if (!room) return;
    room.closeProducer(socket.id, producer_id);
  }

  @SubscribeMessage('exitRoom')
  async handleExit(@ConnectedSocket() socket: Socket): Promise<string> {
    this.logger.log(`Exit room`, {
      name: `${this.roomList.get(socket.data.room_id)?.getPeers().get(socket.id).name}`,
    });
    const room = this.roomList.get(socket.data.room_id);
    if (!room) throw new WsException('Not in a room');
    await room.removePeer(socket.id);
    if (room.getPeers().size === 0) this.roomList.delete(room.id);
    socket.data.room_id = null;
    return 'success';
  }
}
