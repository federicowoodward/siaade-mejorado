# ===== Etapa 1: Build =====
FROM node:20 AS builder
WORKDIR /app

COPY package*.json ./
COPY tsconfig*.json ./
COPY nest-cli.json ./
RUN npm ci

COPY . .
RUN npm run build

# ===== Etapa 2: Runtime =====
FROM node:20-alpine
WORKDIR /app
ENV NODE_ENV=production

COPY package*.json ./
RUN npm ci --omit=dev

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/.env.prod .env

EXPOSE 3000
# OJO: usar shell para '&&'
CMD ["sh", "-c", "npm run start:prod"]
