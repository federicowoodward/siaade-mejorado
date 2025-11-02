#!/bin/sh
set -e

echo "[BOOT] Starting backend container..."

# Ejecutar migraciones (siempre)
echo "[BOOT] Running migrations..."
node ./node_modules/typeorm/cli.js migration:run -d dist/database/datasource.js

# Iniciar la app
echo "[BOOT] Starting NestJS application..."
exec node dist/main.js
