import { UseGuards } from '@nestjs/common';
import {
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server } from 'socket.io';

import { JwtAccessGuard } from 'libs/core-lib/src';

@UseGuards(JwtAccessGuard)
@WebSocketGateway({
  cors: {
    origin: 'http://tauri.localhost',
  },
  path: "/socket/io",
  addTrailingSlash: false,
})
export class ChatGateway {
  @WebSocketServer()
  server: Server;
}
