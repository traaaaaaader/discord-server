// config/mediasoup.config.ts
import { types } from 'mediasoup';
import { WorkerLogTag } from 'mediasoup/node/lib/types';
import * as os from 'os';

//
// 1) Интерфейсы
//

// Worker settings
export interface MediasoupWorkerConfig {
  rtcMinPort: number;
  rtcMaxPort: number;
  logLevel: types.WorkerLogLevel;
  logTags: Array<WorkerLogTag>;
}

// Single codec capability
export interface MediasoupCodec {
  kind: 'audio' | 'video';
  mimeType: string;
  clockRate: number;
  channels?: number;
  parameters?: { [key: string]: number };
  rtcpFeedback: types.RtcpFeedback[];
}

// Router settings
export interface MediasoupRouterConfig {
  mediaCodecs: MediasoupCodec[];
}

// WebRtcTransport settings
export interface MediasoupWebRtcTransportConfig {
  listenIps: types.TransportListenIp[];
  maxIncomingBitrate: number;
  initialAvailableOutgoingBitrate: number;
}

// Общий интерфейс всего конфига
export interface MediasoupConfig {
  listenIp: string;
  listenPort: number;
  sslCrt: string;
  sslKey: string;
  mediasoup: {
    numWorkers: number;
    worker: MediasoupWorkerConfig;
    router: MediasoupRouterConfig;
    webRtcTransport: MediasoupWebRtcTransportConfig;
  };
}

//
// 2) Константа с конфигом
//

export const mediasoupConfig: MediasoupConfig = {
  // на каком IP и порту слушаем HTTPS + Socket.IO
  listenIp: '0.0.0.0',
  listenPort: 3016,
  sslCrt: '../ssl/cert.pem',
  sslKey: '../ssl/key.pem',

  mediasoup: {
    // число воркеров = числу CPU
    numWorkers: os.cpus().length,

    // настройки воркера
    worker: {
      rtcMinPort: 10000,
      rtcMaxPort: 10100,
      logLevel: 'warn',        // 'debug' | 'warn' | 'error' | 'none'
      logTags: [               // LogTag[] из types
        'info',
        'ice',
        'dtls',
        'rtp',
        'srtp',
        'rtcp',
      ],
    },

    // настройки маршрутизатора (кадры/аудио)
    router: {
      mediaCodecs: [
        {
          kind: 'audio',
          mimeType: 'audio/opus',
          clockRate: 48000,
          channels: 2,
          parameters: {},
          rtcpFeedback: [],    // обязательно
        },
        {
          kind: 'video',
          mimeType: 'video/VP8',
          clockRate: 90000,
          parameters: { 'x-google-start-bitrate': 1000 },
          rtcpFeedback: [],    // обязательно
        },
      ],
    },

    // настройки WebRtcTransport
    webRtcTransport: {
      listenIps: [
        {
          ip: '0.0.0.0',
          announcedIp: '127.0.0.1',  // ваш публичный IP или 127.0.0.1
        },
      ],
      maxIncomingBitrate: 1_500_000,
      initialAvailableOutgoingBitrate: 1_000_000,
    },
  },
};
