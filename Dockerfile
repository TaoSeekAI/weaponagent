# Simple multi-service Dockerfile for development
FROM node:20-alpine

RUN apk add --no-cache python3 make g++ bash

WORKDIR /app

# Copy package files
COPY package.json pnpm-workspace.yaml ./
COPY apps/web/package.json ./apps/web/
COPY apps/server/package.json ./apps/server/

# Install pnpm
RUN npm install -g pnpm@8.15.1

# Install all dependencies
RUN pnpm install --frozen-lockfile || pnpm install

# Copy source code
COPY apps/ ./apps/

# Build applications
WORKDIR /app/apps/web
RUN pnpm build || npm run build

WORKDIR /app/apps/server
RUN pnpm build || npm run build

WORKDIR /app

# Create startup script
RUN echo '#!/bin/sh' > /start.sh && \
    echo 'cd /app/apps/server && node dist/index.js &' >> /start.sh && \
    echo 'cd /app/apps/web && npm start' >> /start.sh && \
    chmod +x /start.sh

EXPOSE 3000 3001 3002

CMD ["/start.sh"]