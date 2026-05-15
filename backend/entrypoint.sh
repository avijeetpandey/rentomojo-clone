#!/bin/sh
set -e
echo "▶ Pushing Prisma schema to database…"
npx prisma db push --accept-data-loss
echo "▶ Seeding database…"
npx tsx prisma/seed.ts && echo "✓ Seed complete" || echo "⚠ Seed skipped (data may already exist)"
echo "▶ Starting server…"
exec node dist/server.js
