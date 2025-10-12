# ===== Etapa 1: Build =====
FROM node:20 AS builder
WORKDIR /app

# Instalar deps primero (cache)
COPY package*.json ./
COPY tsconfig*.json ./
COPY nest-cli.json ./
RUN npm ci

# Copiar el resto y compilar
COPY . .
RUN npm run build

# ===== Etapa 2: Runtime =====
FROM node:20-alpine
WORKDIR /app
ENV NODE_ENV=production

# Copiar manifests y script de entrypoint
COPY package*.json ./
COPY docker-entrypoint.sh /app/docker-entrypoint.sh

# Instalar solo prod
RUN npm ci --omit=dev

# Copiar build y env
COPY --from=builder /app/dist ./dist
# Si querés renombrar .env.prod a .env en la imagen:
COPY --from=builder /app/.env.prod .env

# Asegurar LF y permisos ejecutables (por si vino con CRLF)
RUN sed -i 's/\r$//' /app/docker-entrypoint.sh && \
    chmod +x /app/docker-entrypoint.sh

EXPOSE 3000
CMD ["/app/docker-entrypoint.sh"]
