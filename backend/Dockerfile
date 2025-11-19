# ===== Etapa 1: Build =====
FROM node:20 AS builder
WORKDIR /app

# Instalar deps primero (cache)
COPY package*.json ./
COPY tsconfig*.json ./
COPY nest-cli.json ./
# Usamos npm install (no-ci) en la etapa de build para evitar fallos por
# desincronizaci�n menor del lockfile con dependencias de desarrollo.
RUN npm install

# Copiar el resto y compilar
COPY . .
RUN rm -rf dist && npm run build

# ===== Etapa 2: Runtime =====
FROM node:20-alpine
WORKDIR /app
ENV NODE_ENV=production

# Copiar manifests y script de entrypoint
COPY package*.json ./
# TODO(PDF-GENERATOR): instalar dependencias del sistema para Chromium/Puppeteer en Alpine.
# En runtime instalamos solo dependencias de prod sin exigir lock estricto
# para evitar el error de desincronizaci�n en CI.
RUN npm install --omit=dev

# Copiar build y env
COPY --from=builder /app/dist ./dist
COPY ./docker-entrypoint.sh /app/docker-entrypoint.sh
RUN sed -i 's/\r$//' /app/docker-entrypoint.sh && chmod +x /app/docker-entrypoint.sh

EXPOSE 3000
CMD ["/app/docker-entrypoint.sh"]
