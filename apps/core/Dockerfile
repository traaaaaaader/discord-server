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

# Копируем весь исходный код
COPY . .

# Собираем приложение для core
RUN npm run build core


# Stage 2: Production
FROM node:18-alpine

WORKDIR /app

# Устанавливаем curl для healthcheck
RUN apk add --no-cache curl

COPY package*.json ./
RUN npm ci --omit=dev --ignore-scripts

# Копируем собранные файлы и Prisma схемы
COPY --from=builder /app/dist/apps/core ./dist
COPY --from=builder /app/prisma/chat/schema.prisma ./prisma/chat/
COPY --from=builder /app/prisma/user/schema.prisma ./prisma/user/
COPY --from=builder /app/prisma/server/schema.prisma ./prisma/server/

# Копируем сгенерированные Prisma клиенты
COPY --from=builder /app/node_modules/.prisma/client ./node_modules/.prisma/client
COPY --from=builder /app/node_modules/@prisma/db-chat ./node_modules/@prisma/db-chat
COPY --from=builder /app/node_modules/@prisma/db-auth ./node_modules/@prisma/db-auth
COPY --from=builder /app/node_modules/@prisma/db-server ./node_modules/@prisma/db-server

CMD ["node", "dist/main.js"]
