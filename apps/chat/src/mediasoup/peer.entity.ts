import { types as mediasoupTypes } from 'mediasoup';

export class Peer {
  id: string;
  name: string;
  transports: Map<string, mediasoupTypes.Transport>;
  consumers: Map<string, mediasoupTypes.Consumer>;
  producers: Map<string, mediasoupTypes.Producer>;

  constructor(socketId: string, name: string) {
    this.id = socketId;
    this.name = name;
    this.transports = new Map();
    this.consumers = new Map();
    this.producers = new Map();
  }

  addTransport(transport: any) {
    this.transports.set(transport.id, transport);
  }

  async connectTransport(
    transportId: string,
    dtlsParameters: mediasoupTypes.DtlsParameters,
  ) {
    if (!this.transports.has(transportId)) return;
    await this.transports.get(transportId).connect({ dtlsParameters });
  }

  async createProducer(
    producerTransportId: string,
    rtpParameters: mediasoupTypes.RtpParameters,
    kind: mediasoupTypes.MediaKind,
  ) {
    const transport = this.transports.get(producerTransportId);
    if (!transport) throw new Error('Transport not found');

    const producer = await transport.produce({ kind, rtpParameters });
    this.producers.set(producer.id, producer);

    producer.on('transportclose', () => {
      console.log('Producer transport close', {
        name: this.name,
        producerId: producer.id,
      });
      producer.close();
      this.producers.delete(producer.id);
    });

    return producer;
  }

  async createConsumer(
    consumerTransportId: string,
    producerId: string,
    rtpCapabilities: mediasoupTypes.RtpCapabilities,
  ) {
    const consumerTransport = this.transports.get(consumerTransportId);
    if (!consumerTransport) throw new Error('Consumer transport not found');

    let consumer = null;
    try {
      consumer = await consumerTransport.consume({
        producerId,
        rtpCapabilities,
        paused: false,
      });
    } catch (error) {
      console.error('Consume failed', error);
      return;
    }

    if (consumer.type === 'simulcast') {
      await consumer.setPreferredLayers({ spatialLayer: 2, temporalLayer: 2 });
    }

    this.consumers.set(consumer.id, consumer);

    consumer.on('transportclose', () => {
      console.log('Consumer transport close', {
        name: this.name,
        consumerId: consumer.id,
      });
      this.consumers.delete(consumer.id);
    });

    return {
      consumer,
      params: {
        producerId,
        id: consumer.id,
        kind: consumer.kind,
        rtpParameters: consumer.rtpParameters,
        type: consumer.type,
        producerPaused: consumer.producerPaused,
      },
    };
  }

  closeProducer(producerId: string) {
    try {
      this.producers.get(producerId)?.close();
    } catch (e) {
      console.warn(e);
    }
    this.producers.delete(producerId);
  }

  getProducer(producerId: string) {
    return this.producers.get(producerId);
  }

  close() {
    this.transports.forEach((transport) => transport.close());
  }

  removeConsumer(consumerId: string) {
    this.consumers.delete(consumerId);
  }
}
