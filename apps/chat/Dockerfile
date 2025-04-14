# Stage 1: Build
FROM node:18-alpine AS builder

WORKDIR /app

# Устанавливаем системные зависимости для mediasoup и сборки
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

# Копируем зависимости
COPY package*.json ./
COPY prisma/ ./prisma/

# Устанавливаем Node.js зависимости и генерируем Prisma клиент
RUN npm ci && \
    npm run prisma:gen

# Собираем mediasoup worker с явным указанием архитектуры
RUN npm rebuild mediasoup --build-from-source

# Копируем исходный код
COPY . .

# Собираем приложение
RUN npm run build chat

# Stage 2: Production
FROM node:18-alpine

WORKDIR /app

# Устанавливаем рантайм-зависимости для mediasoup
RUN apk add --no-cache \
    libstdc++ \
    libc6-compat \
    bash

# Копируем package.json и устанавливаем production зависимости
COPY package*.json ./
RUN npm ci --omit=dev --ignore-scripts

# Копируем собранные файлы и Prisma схемы
COPY --from=builder /app/dist/apps/chat ./dist
COPY --from=builder /app/prisma/chat/schema.prisma ./prisma/chat/
COPY --from=builder /app/prisma/user/schema.prisma ./prisma/user/
COPY --from=builder /app/prisma/server/schema.prisma ./prisma/server/

# Копируем сгенерированные Prisma клиенты и медиасуп
COPY --from=builder /app/node_modules/.prisma/client ./node_modules/.prisma/client
COPY --from=builder /app/node_modules/@prisma/db-chat ./node_modules/@prisma/db-chat
COPY --from=builder /app/node_modules/@prisma/db-auth ./node_modules/@prisma/db-auth
COPY --from=builder /app/node_modules/@prisma/db-server ./node_modules/@prisma/db-server
COPY --from=builder /app/node_modules/mediasoup/worker ./node_modules/mediasoup/worker

# Запускаем приложение
CMD ["node", "dist/main.js"]