# Stage 1: Builder
FROM node:18-alpine AS builder

RUN apk add --no-cache \
    curl \
    python3 \
    pkgconfig \
    make \
    g++ \
    libc6-compat \
    bash \
    libtool \
    autoconf \
    automake \
    py3-pip \
    linux-headers \
    cmake \
    ninja

WORKDIR /app

# Копируем файлы зависимостей и Prisma
COPY package*.json ./
COPY prisma/ ./prisma/

# Устанавливаем зависимости и генерируем Prisma Client
RUN npm ci && npm run prisma:gen

# Сборка mediasoup worker (если требуется)
RUN npm rebuild mediasoup --build-from-source

# Копируем остальной исходный код
COPY . .

# Собираем приложение для chat
RUN npm run build chat


# Stage 2: Production
FROM node:18-alpine

WORKDIR /app

# Устанавливаем runtime-зависимости для mediasoup
RUN apk add --no-cache \
    libstdc++ \
    libc6-compat \
    bash

# Копируем файлы зависимостей и устанавливаем production-зависимости
COPY package*.json ./
RUN npm ci --omit=dev --ignore-scripts

# Копируем собранные файлы и Prisma схемы
COPY --from=builder /app/dist/apps/chat ./dist
COPY --from=builder /app/prisma/chat/schema.prisma ./prisma/chat/
COPY --from=builder /app/prisma/user/schema.prisma ./prisma/user/
COPY --from=builder /app/prisma/server/schema.prisma ./prisma/server/

# Копируем сгенерированные Prisma клиенты и медиасуп worker
COPY --from=builder /app/node_modules/.prisma/client ./node_modules/.prisma/client
COPY --from=builder /app/node_modules/@prisma/db-chat ./node_modules/@prisma/db-chat
COPY --from=builder /app/node_modules/@prisma/db-auth ./node_modules/@prisma/db-auth
COPY --from=builder /app/node_modules/@prisma/db-server ./node_modules/@prisma/db-server
COPY --from=builder /app/node_modules/mediasoup/worker ./node_modules/mediasoup/worker

CMD ["node", "dist/main.js"]
