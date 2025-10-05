###############
# Stage build #
###############
FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
# Necesitamos devDependencies para compilar TypeScript
RUN npm ci
COPY tsconfig.json ./
COPY src ./src
RUN npm run build

################
# Stage runtime #
################
FROM node:20-alpine
WORKDIR /app
ENV NODE_ENV=production \
    BOT_HTTP_PORT=5001

COPY package*.json ./
# Instalar sólo prod deps
RUN npm ci --omit=dev && npm cache clean --force

COPY --from=build /app/dist ./dist

EXPOSE 5001
CMD ["node","dist/http/server.js"]
