# ===== Etapa 1: Build =====
FROM node:20 AS builder
WORKDIR /app

COPY package*.json ./
COPY tsconfig*.json ./
COPY nest-cli.json ./
# Usamos npm install (no-ci) en la etapa de build para evitar fallos por
# desincronización menor del lockfile con dependencias de desarrollo.
RUN npm install

COPY . .
RUN rm -rf dist && npm run build

# ===== Etapa 2: Runtime =====
FROM node:20-alpine
WORKDIR /app
ENV NODE_ENV=production

COPY package*.json ./
RUN npm ci --omit=dev

COPY --from=builder /app/dist ./dist
COPY ./docker-entrypoint.sh /app/docker-entrypoint.sh
RUN sed -i 's/\r$//' /app/docker-entrypoint.sh && chmod +x /app/docker-entrypoint.sh

EXPOSE 3000
CMD ["/app/docker-entrypoint.sh"]
