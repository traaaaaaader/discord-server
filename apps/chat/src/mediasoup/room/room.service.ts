import { mediaCodecs } from '../media.config';
import { Injectable, Logger } from '@nestjs/common';
import { IRoom } from './room.interface';
import { MediasoupService } from '../mediasoup.service';

@Injectable()
export class RoomService {
  private readonly logger = new Logger(RoomService.name);
  private rooms: Map<string, IRoom> = new Map();

  constructor(private readonly mediasoupService: MediasoupService) {}

  public async createRoom(roomId: string): Promise<IRoom> {
    this.logger.log(`Creating room ${roomId}`);
    
    if (this.rooms.has(roomId)) {
      this.logger.debug(`Room ${roomId} already exists`);
      return this.rooms.get(roomId);
    }

    try {
      const worker = this.mediasoupService.getWorker();
      const router = await worker.createRouter({ mediaCodecs });
      const newRoom: IRoom = {
        id: roomId,
        router: { router },
        peers: new Map(),
      };
      
      this.rooms.set(roomId, newRoom);
      this.logger.log(`Room ${roomId} created with router ${router.id}`);
      
      return newRoom;
    } catch (error) {
      this.logger.error(`Failed to create room ${roomId}: ${error.message}`, error.stack);
      throw error;
    }
  }

  public getRoom(roomId: string): IRoom | undefined {
    const exists = this.rooms.has(roomId);
    this.logger.debug(`Get room ${roomId} - ${exists ? 'found' : 'not found'}`);
    return this.rooms.get(roomId);
  }

  public removeRoom(roomId: string): void {
    if (this.rooms.delete(roomId)) {
      this.logger.log(`Room ${roomId} removed`);
    } else {
      this.logger.warn(`Attempted to remove non-existing room ${roomId}`);
    }
  }

  public addPeerToRoom(roomId: string, peerId: string, username: string) {
    this.logger.log(`Adding peer ${peerId} to room ${roomId}`);
    
    const room = this.rooms.get(roomId);
    if (!room) {
      this.logger.error(`Room ${roomId} not found`);
      throw new Error(`Room ${roomId} not found`);
    }

    if (!room.peers.has(peerId)) {
      room.peers.set(peerId, {
        id: peerId,
        transports: new Map(),
        producers: new Map(),
        consumers: new Map(),
        username,
      });
      this.logger.debug(`Peer ${peerId} added to room ${roomId}`);
    } else {
      this.logger.warn(`Peer ${peerId} already exists in room ${roomId}`);
    }
  }

  public removePeerFromRoom(roomId: string, peerId: string) {
    this.logger.log(`Removing peer ${peerId} from room ${roomId}`);
    
    const room = this.rooms.get(roomId);
    if (room) {
      if (room.peers.delete(peerId)) {
        this.logger.debug(`Peer ${peerId} removed from room ${roomId}`);
      } else {
        this.logger.warn(`Peer ${peerId} not found in room ${roomId}`);
      }
    }
  }
}