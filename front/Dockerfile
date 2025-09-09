## Multi-stage build para Angular + Express con versión fija de Node
## Etapa de build
FROM node:22.12.0 AS build
WORKDIR /app

# Copiamos manifiestos primero para cache de dependencias
COPY package*.json ./
RUN npm install --legacy-peer-deps

# Copiamos el resto del código
COPY . .

# Build de producción Angular
RUN npm run build:prod

## Etapa runtime (más liviana)
FROM node:22.12.0 AS runtime
ENV NODE_ENV=production
WORKDIR /app

# Solo copiamos lo necesario para servir
COPY package*.json ./
RUN npm install --omit=dev --legacy-peer-deps

# Copiamos el servidor y la carpeta dist generada
COPY server.js ./
COPY --from=build /app/dist ./dist

EXPOSE 4000
CMD ["node", "server.js"]
