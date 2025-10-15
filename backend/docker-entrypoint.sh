#!/bin/sh
set -e

echo "[BOOT] Starting backend container..."

# Permitir omitir migraciones en runtime (útil en entornos donde ya se corrieron desde afuera)
if [ "$SKIP_MIGRATIONS" = "true" ]; then
  echo "[BOOT] SKIP_MIGRATIONS=true → Saltando ejecución de migraciones"
elif [ "$RESET_ON_START" = "true" ]; then
  echo "[BOOT] RESET_ON_START=true → Reverting ALL migrations then running fresh"
  # Revertir todas las migraciones (loop hasta que falle)
  while node ./node_modules/typeorm/cli.js migration:revert -d dist/database/datasource.js 2>/dev/null; do
    echo "  ✓ Reverted one migration"
    sleep 1
  done
  echo "  → All migrations reverted, now running fresh..."
  node ./node_modules/typeorm/cli.js migration:run -d dist/database/datasource.js
elif [ "$RESEED_ON_START" = "true" ]; then
  echo "[BOOT] RESEED_ON_START=true → Running reseed (revert last + run)"
  npm run reseed:prod
else
  echo "[BOOT] Default mode → Running migrations normally"
  npm run migrate:prod
fi

echo "[BOOT] Starting NestJS application..."
exec node dist/main.js
