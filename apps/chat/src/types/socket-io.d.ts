// src/types/socket-io.d.ts

import { User } from '@prisma/db-auth';  // или откуда у вас берётся тип User

// Расширяем модуль 'socket.io', добавляя в Handshake поле user
declare module 'socket.io' {
  interface Handshake {
    /**
     * В JwtWsGuard мы прописываем в client.handshake.user
     * сам объект пользователя, возвращённый из JwtAccessStrategy.validate()
     */
    user?: User;
  }
}
