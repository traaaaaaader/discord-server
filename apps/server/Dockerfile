# Stage 1: Build
FROM node:18-alpine AS builder

WORKDIR /app

# Copy dependency files
COPY package*.json ./
COPY prisma/ ./prisma/

# Install dependencies
RUN npm ci

# Generate Prisma client for server
RUN npm run prisma:gen

# Copy source code
COPY . .

# Build specific service
RUN npm run build server

# Stage 2: Production
FROM node:18-alpine

WORKDIR /app

# Copy production dependencies
COPY package*.json ./
RUN npm ci --omit=dev

# Copy built files and prisma schema
COPY --from=builder /app/dist/apps/server ./dist
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
#npm run prisma:migrate:deploy && 