
import { Server } from 'socket.io';
import { types as mediasoupTypes } from 'mediasoup';
import { mediasoupConfig } from './mediasoup.config';
import { Peer } from './peer.entity';

export class Room {
  id: string;
  router: mediasoupTypes.Router;
  peers: Map<string, Peer>;
  io: Server;

  constructor(roomId: string, worker: mediasoupTypes.Worker, io: Server) {
    this.id = roomId;
    this.peers = new Map();
    this.io = io;
  }

  static async create(id: string, worker: mediasoupTypes.Worker, server: Server): Promise<Room> {
    const room = new Room(id, worker, server);
    room.router = await worker.createRouter({ mediaCodecs: mediasoupConfig.mediasoup.router.mediaCodecs });
    return room;
  }

  addPeer(peer: Peer) {
    this.peers.set(peer.id, peer);
  }

  getProducerListForPeer() {
    const producerList = [];
    this.peers.forEach((peer) => {
      peer.producers.forEach((producer) => {
        producerList.push({ producer_id: producer.id });
      });
    });
    return producerList;
  }

  getRtpCapabilities(): mediasoupTypes.RtpCapabilities {
    return this.router.rtpCapabilities;
  }

  async createWebRtcTransport(socketId: string) {
    const { maxIncomingBitrate, initialAvailableOutgoingBitrate, listenIps } = mediasoupConfig.mediasoup.webRtcTransport;

    const transport = await this.router.createWebRtcTransport({
      listenIps,
      enableUdp: true,
      enableTcp: true,
      preferUdp: true,
      initialAvailableOutgoingBitrate,
    });

    if (maxIncomingBitrate) {
      try {
        await transport.setMaxIncomingBitrate(maxIncomingBitrate);
      } catch (error) {
        console.error('setMaxIncomingBitrate error', error);
      }
    }

    transport.on('dtlsstatechange', (dtlsState) => {
      if (dtlsState === 'closed') {
        console.log('Transport closed', { name: this.peers.get(socketId)?.name });
        transport.close();
      }
    });

    transport.on('@close', () => {
      console.log('Transport closed', { name: this.peers.get(socketId)?.name });
    });

    console.log('Adding transport', { transportId: transport.id });

    this.peers.get(socketId)?.addTransport(transport);

    return {
      params: {
        id: transport.id,
        iceParameters: transport.iceParameters,
        iceCandidates: transport.iceCandidates,
        dtlsParameters: transport.dtlsParameters,
      },
    };
  }

  async connectPeerTransport(socketId: string, transportId: string, dtlsParameters: mediasoupTypes.DtlsParameters) {
    const peer = this.peers.get(socketId);
    if (!peer) return;
    await peer.connectTransport(transportId, dtlsParameters);
  }

  async produce(socketId: string, producerTransportId: string, rtpParameters: mediasoupTypes.RtpParameters, kind: mediasoupTypes.MediaKind): Promise<string> {
    const peer = this.peers.get(socketId);
    if (!peer) throw new Error('Peer not found');

    const producer = await peer.createProducer(producerTransportId, rtpParameters, kind);

    this.broadCast(socketId, 'newProducers', [{
      producer_id: producer.id,
      producer_socket_id: socketId,
    }]);

    return producer.id;
  }

  async consume(socketId: string, consumerTransportId: string, producerId: string, rtpCapabilities: mediasoupTypes.RtpCapabilities) {
    if (!this.router.canConsume({ producerId, rtpCapabilities })) {
      console.error('Cannot consume');
      return;
    }

    const peer = this.peers.get(socketId);
    if (!peer) return;

    const { consumer, params } = await peer.createConsumer(consumerTransportId, producerId, rtpCapabilities);

    consumer.on('producerclose', () => {
      console.log('Consumer closed due to producerclose', { name: peer.name, consumerId: consumer.id });
      peer.removeConsumer(consumer.id);
      this.io.to(socketId).emit('consumerClosed', { consumer_id: consumer.id });
    });

    return params;
  }

  async removePeer(socketId: string) {
    const peer = this.peers.get(socketId);
    if (!peer) return;

    peer.close();
    this.peers.delete(socketId);
  }

  closeProducer(socketId: string, producerId: string) {
    const peer = this.peers.get(socketId);
    if (!peer) return;

    peer.closeProducer(producerId);
  }

  broadCast(socketId: string, eventName: string, data: any) {
    for (const otherId of Array.from(this.peers.keys()).filter(id => id !== socketId)) {
      this.send(otherId, eventName, data);
    }
  }

  send(socketId: string, eventName: string, data: any) {
    this.io.to(socketId).emit(eventName, data);
  }

  getPeers() {
    return this.peers;
  }

  toJson() {
    return {
      id: this.id,
      peers: JSON.stringify([...this.peers]),
    };
  }
}
