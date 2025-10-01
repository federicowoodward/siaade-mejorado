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
# Inicia migraciones y la app. Si RESEED_ON_START=true, hace revert+run (reseed)
CMD ["sh", "-c", "\
	if [ \"$RESET_ON_START\" = \"true\" ]; then \\
		echo '[BOOT] RESET_ON_START=true → reverting ALL migrations then running migrate'; \\
		npm run reset:prod; \\
	elif [ \"$RESEED_ON_START\" = \"true\" ]; then \\
		echo '[BOOT] RESEED_ON_START=true → running reseed:prod'; \\
		npm run reseed:prod; \\
	else \\
		echo '[BOOT] default → running migrate:prod'; \\
		npm run migrate:prod; \\
	fi && node dist/main.js"]
