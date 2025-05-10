import { Injectable, Logger } from '@nestjs/common';
import { RoomService } from '../room/room.service';
import { IConsumeParams, IProduceParams } from './producer-consumer.interface';
import { Consumer } from 'mediasoup/node/lib/types';

@Injectable()
export class ProducerConsumerService {
  private readonly logger = new Logger(ProducerConsumerService.name);

  constructor(private readonly roomService: RoomService) {}

  public async createProducer(params: IProduceParams): Promise<string> {
    const { roomId, peerId, kind, rtpParameters, transportId } = params;
    this.logger.log(`Creating producer for peer ${peerId} in room ${roomId}`);

    try {
      const room = this.roomService.getRoom(roomId);
      if (!room) {
        this.logger.error(`Room ${roomId} not found`);
        throw new Error(`Room ${roomId} not found`);
      }

      const peer = room.peers.get(peerId);
      if (!peer) {
        this.logger.error(`Peer ${peerId} not found`);
        throw new Error(`Peer ${peerId} not found`);
      }

      const already = Array.from(peer.producers.values()).find(
        (p) =>
          p.producer.appData?.transportId === transportId &&
          p.producer.kind === kind,
      );
      if (already) {
        this.logger.debug(`Reusing existing producer ${already.producer.id}`);
        return already.producer.id;
      }

      const transportData = peer.transports.get(transportId);
      if (!transportData) {
        this.logger.error(`Transport ${transportId} not found`);
        throw new Error('Transport not found');
      }

      const producer = await transportData.transport.produce({
        kind,
        rtpParameters,
      });
      peer.producers.set(producer.id, { producer });

      this.logger.log(`Producer ${producer.id} created for peer ${peerId}`);
      return producer.id;
    } catch (error) {
      this.logger.error(
        `Producer creation failed: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  public async createConsumer(params: IConsumeParams): Promise<any> {
    const { roomId, peerId, producerId, rtpCapabilities, transportId } = params;
    this.logger.log(`Creating consumer for peer ${peerId} in room ${roomId}`);

    try {
      const room = this.roomService.getRoom(roomId);
      if (!room) {
        this.logger.error(`Room ${roomId} not found`);
        throw new Error(`Room ${roomId} not found`);
      }

      if (!room.router.router.canConsume({ producerId, rtpCapabilities })) {
        this.logger.error(`Cannot consume producer ${producerId}`);
        throw new Error(`Cannot consume producer ${producerId}`);
      }

      const peer = room.peers.get(peerId)!;
      const existing = Array.from(peer.consumers.values()).find(
        (c) => c.consumer.producerId === producerId,
      );

      if (existing) {
        this.logger.debug(`Using existing consumer ${existing.consumer.id}`);
        return {
          id: existing.consumer.id,
          producerId,
          kind: existing.consumer.kind,
          rtpParameters: existing.consumer.rtpParameters,
        };
      }

      const transportData = peer.transports.get(transportId);
      if (!transportData) {
        this.logger.error(`Transport ${transportId} not found`);
        throw new Error('Transport not found');
      }

      const consumer = await transportData.transport.consume({
        producerId,
        rtpCapabilities,
        paused: false,
      });

      peer.consumers.set(consumer.id, { consumer });
      this.logger.log(`Consumer ${consumer.id} created for peer ${peerId}`);

      return {
        id: consumer.id,
        producerId,
        kind: consumer.kind,
        rtpParameters: consumer.rtpParameters,
      };
    } catch (error) {
      this.logger.error(
        `Consumer creation failed: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }
}
