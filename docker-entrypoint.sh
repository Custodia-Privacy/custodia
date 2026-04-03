#!/bin/sh
set -e

echo "[entrypoint] Running database migrations..."
if node /opt/prisma/node_modules/prisma/build/index.js migrate deploy --schema=/app/prisma/schema.prisma; then
  echo "[entrypoint] Migrations applied successfully."
else
  if [ "${SKIP_MIGRATION_CHECK:-false}" = "true" ]; then
    echo "[entrypoint] WARNING: Migration failed but SKIP_MIGRATION_CHECK=true. Starting app anyway..."
  else
    echo "[entrypoint] FATAL: Migration failed (exit $?). Set SKIP_MIGRATION_CHECK=true to override."
    exit 1
  fi
fi

echo "[entrypoint] Starting Next.js..."
exec node server.js
