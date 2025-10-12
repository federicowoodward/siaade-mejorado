# Etapa 1: build de la app
FROM node:22-alpine AS build
WORKDIR /app

COPY package*.json ./
RUN npm install --force

COPY . .
# Build de producción (usa environment.prod.ts)
RUN npm run build:prod

# Etapa 2: runtime con Node/Express sirviendo la carpeta dist
FROM node:22-alpine
WORKDIR /app

# Solo dependencias de runtime (express ya está en deps)
COPY package*.json ./
RUN npm install --omit=dev --force

# Copiamos el build y el servidor estático
COPY --from=build /app/dist ./dist
COPY ./server.js ./server.js

# Railway inyecta $PORT; server.js lo respeta
ENV NODE_ENV=production
EXPOSE 4000
CMD ["node", "server.js"]