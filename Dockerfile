# Stage 1: Build
FROM node:18-alpine AS builder

WORKDIR /app

# Copy dependency files
COPY package*.json ./
COPY prisma/ ./prisma/

# Install dependencies and generate Prisma client
RUN apk add --no-cache curl && \
    npm ci && \
    npm run prisma:gen

# Copy source code
COPY . .

# Build specific service
RUN npm run build chat

# Stage 2: Production
FROM node:18-alpine

WORKDIR /app

# Install curl for healthchecks
RUN apk add --no-cache curl

# Copy production dependencies
COPY package*.json ./
RUN npm ci --omit=dev

# Copy built files and Prisma schema
COPY --from=builder /app/dist/apps/chat ./dist
COPY --from=builder /app/prisma/chat/schema.prisma ./prisma/chat/
COPY --from=builder /app/prisma/user/schema.prisma ./prisma/user/
COPY --from=builder /app/prisma/server/schema.prisma ./prisma/server/

# Copy Prisma client
COPY --from=builder /app/node_modules/.prisma/client ./node_modules/.prisma/client
COPY --from=builder /app/node_modules/@prisma/db-chat ./node_modules/@prisma/db-chat
COPY --from=builder /app/node_modules/@prisma/db-auth ./node_modules/@prisma/db-auth
COPY --from=builder /app/node_modules/@prisma/db-server ./node_modules/@prisma/db-server

# Migration and startup
CMD ["node", "dist/main.js"]