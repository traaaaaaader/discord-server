import {
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server } from 'socket.io';
import { JwtAccessGuard } from '@app/auth';
import { UseGuards } from '@nestjs/common';

@UseGuards(JwtAccessGuard)
@WebSocketGateway({
  cors: {
    origin: 'http://localhost:1420',
  },
  path: "/socket/io",
  addTrailingSlash: false,
})
export class ChatGateway {
  @WebSocketServer()
  server: Server;
}
