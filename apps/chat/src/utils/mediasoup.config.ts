// src/mediasoup-config.ts
import mediasoup from 'mediasoup';

const workerSettings = {
  logLevel: 'warn' as mediasoup.types.WorkerLogLevel,
  rtcMinPort: 10000,
  rtcMaxPort: 10100,
};

const routerOptions = {
  mediaCodecs: [
    {
      kind: 'audio' as const,
      mimeType: 'audio/opus',
      clockRate: 48000,
      channels: 2,
    },
    {
      kind: 'video' as const,
      mimeType: 'video/VP8',
      clockRate: 90000,
    },
  ],
};

let worker: mediasoup.types.Worker;
let router: mediasoup.types.Router;

export const createWorker = async () => {
  worker = await mediasoup.createWorker(workerSettings);
  worker.on('died', () => {
    console.error('MediaSoup worker has died');
    process.exit(1);
  });

  router = await worker.createRouter(routerOptions);
  return { worker, router };
};

export const getRouter = () => {
  if (!router) {
    throw new Error('Router not initialized');
  }
  return router;
};

export const createWebRtcTransport = async () => {
  const router = getRouter();
  
  const transport = await router.createWebRtcTransport({
    listenIps: [{ 
      ip: process.env.MEDIASOUP_LISTEN_IP || '0.0.0.0', 
      announcedIp: process.env.MEDIASOUP_ANNOUNCED_IP 
    }],
    enableUdp: true,
    enableTcp: true,
    preferUdp: true,
  });

  transport.on('dtlsstatechange', (state) => {
    if (state === 'closed') transport.close();
  });

  return {
    id: transport.id,
    iceParameters: transport.iceParameters,
    iceCandidates: transport.iceCandidates,
    dtlsParameters: transport.dtlsParameters,
  };
};