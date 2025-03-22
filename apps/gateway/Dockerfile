# Stage 1: Build
FROM node:18-alpine AS builder

# Устанавливаем зависимости, необходимые для работы mkcert
# RUN apk add --no-cache nss-tools wget

# Скачиваем статически скомпилированный бинарник mkcert
# RUN wget -O /usr/local/bin/mkcert "https://dl.filippo.io/mkcert/latest?for=linux/amd64" \
#     && chmod +x /usr/local/bin/mkcert

# Создаем директорию для сертификатов
# RUN mkdir -p /app/secrets

# Генерируем сертификаты
# WORKDIR /app/secrets
# RUN mkcert -install && mkcert -key-file localhost-key.pem -cert-file localhost.pem localhost


WORKDIR /app

# Copy dependency files
COPY package*.json ./
COPY prisma/ ./prisma/

# Install dependencies
RUN npm ci

# Generate Prisma client for chat
RUN npm run prisma:gen

# Copy source code
COPY . .

# Build specific service
RUN npm run build gateway

# Stage 2: Production
FROM node:18-alpine

WORKDIR /app

# RUN apk add --no-cache nss-tools \
#     && wget -O /usr/local/bin/mkcert "https://dl.filippo.io/mkcert/latest?for=linux/amd64" \
#     && chmod +x /usr/local/bin/mkcert \
#     && mkcert -install

# Копируем сертификаты из builder
# COPY --from=builder /app/secrets/localhost.pem /app/secrets/localhost.pem
# COPY --from=builder /app/secrets/localhost-key.pem /app/secrets/localhost-key.pem


# Copy production dependencies
COPY package*.json ./
RUN npm ci --omit=dev

# Copy built files and prisma schema
COPY --from=builder /app/dist/apps/gateway ./dist
COPY --from=builder /app/prisma/chat/schema.prisma ./prisma/chat/
COPY --from=builder /app/prisma/user/schema.prisma ./prisma/user/
COPY --from=builder /app/prisma/server/schema.prisma ./prisma/server/

# Copy Prisma client
COPY --from=builder /app/node_modules/.prisma/client ./node_modules/.prisma/client
COPY --from=builder /app/node_modules/@prisma/db-chat ./node_modules/@prisma/db-chat
COPY --from=builder /app/node_modules/@prisma/db-auth ./node_modules/@prisma/db-auth
COPY --from=builder /app/node_modules/@prisma/db-server ./node_modules/@prisma/db-server

# Migration and startup
CMD ["sh", "-c", "node dist/main.js"]