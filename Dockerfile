# Frontend build stage
FROM node:20-alpine AS frontend-deps
WORKDIR /app
COPY apps/web/package.json ./
RUN npm install

FROM node:20-alpine AS frontend-builder
WORKDIR /app
COPY apps/web ./
COPY --from=frontend-deps /app/node_modules ./node_modules
RUN npm run build

FROM node:20-alpine AS frontend
WORKDIR /app
COPY --from=frontend-builder /app/.next ./.next
COPY --from=frontend-builder /app/public ./public
COPY --from=frontend-builder /app/package.json ./
COPY --from=frontend-builder /app/node_modules ./node_modules
EXPOSE 3000
CMD ["npm", "start"]

# Backend build stage
FROM node:20-alpine AS backend-deps
WORKDIR /app
COPY apps/server/package.json ./
RUN npm install

FROM node:20-alpine AS backend-builder
WORKDIR /app
COPY apps/server ./
COPY --from=backend-deps /app/node_modules ./node_modules
RUN npm run build

FROM node:20-alpine AS backend
WORKDIR /app
RUN apk add --no-cache python3 make g++
COPY --from=backend-builder /app/dist ./dist
COPY --from=backend-builder /app/package.json ./
COPY --from=backend-builder /app/node_modules ./node_modules
EXPOSE 3001 3002
CMD ["node", "dist/index.js"]