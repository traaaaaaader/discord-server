import {
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server } from 'socket.io';
import { UseGuards } from '@nestjs/common';
import { JwtAccessGuard } from '@app/auth';

@UseGuards(JwtAccessGuard)
@WebSocketGateway({
  cors: {
    origin: '*',
  },
 })
export class ChatGateway {
  @WebSocketServer()
  server: Server;

}
