FROM node:20-alpine AS builder
WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
ARG ANGULAR_CONFIGURATION=production
RUN npm run build -- --configuration ${ANGULAR_CONFIGURATION}

FROM node:20-alpine
WORKDIR /app

RUN npm install -g serve@14
COPY --from=builder /app/dist/front/browser ./dist

ENV NODE_ENV=production
EXPOSE 4000
CMD ["serve", "-s", "dist", "-l", "4000"]
