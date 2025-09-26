# Etapa 1: build de la app
FROM node:22-alpine AS build
WORKDIR /app

COPY package*.json ./
RUN npm install --force

COPY . .
RUN npm run build:qa

FROM nginx:1.25-alpine
COPY --from=build /app/dist/front/browser /usr/share/nginx/html
COPY ./nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]