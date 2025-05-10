import { IWorker } from './interface/media-resources.interfaces';
import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import * as mediasoup from 'mediasoup';
import * as os from 'os';

@Injectable()
export class MediasoupService implements OnModuleInit {
  private readonly logger = new Logger(MediasoupService.name);
  private nextWorkerIndex = 0;
  private workers: IWorker[] = [];

  public async onModuleInit() {
    const numWorkers = os.cpus().length;
    this.logger.log(`Initializing ${numWorkers} mediasoup workers`);
    
    for (let i = 0; i < numWorkers; ++i) {
      await this.createWorker();
    }
    this.logger.log('All mediasoup workers initialized');
  }

  private async createWorker() {
    try {
      const worker = await mediasoup.createWorker({
        rtcMinPort: 6002,
        rtcMaxPort: 6202,
      });

      worker.on('died', () => {
        this.logger.error('Mediasoup worker died, exiting process');
        setTimeout(() => process.exit(1), 2000);
      });

      this.workers.push({ worker, routers: new Map() });
      this.logger.debug(`Worker ${worker.pid} created`);
    } catch (error) {
      this.logger.error('Failed to create mediasoup worker', error.stack);
      throw error;
    }
  }

  public getWorker() {
    const worker = this.workers[this.nextWorkerIndex].worker;
    this.nextWorkerIndex = (this.nextWorkerIndex + 1) % this.workers.length;
    this.logger.debug(`Using worker ${worker.pid}`);
    return worker;
  }
}