#!/usr/bin/env bash
# post-deploy.sh — Run on the cPanel server after git pull + asset upload.
# Usage: bash scripts/post-deploy.sh [--skip-migrations]
set -euo pipefail

SKIP_MIGRATIONS=false
for arg in "$@"; do
  [[ "$arg" == "--skip-migrations" ]] && SKIP_MIGRATIONS=true
done

APP_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$APP_DIR"

log() { echo "[$(date '+%H:%M:%S')] $*"; }

log "=== ChanTrader post-deploy ==="
log "Directory : $APP_DIR"
log "Git commit : $(git log -1 --oneline)"

# PHP dependencies — composer.phar lives in the repo root on this server
log "→ composer install --no-dev..."
php composer.phar install --no-dev --optimize-autoloader --no-interaction --no-progress

# Database migrations
if [[ "$SKIP_MIGRATIONS" == "false" ]]; then
  log "→ php artisan migrate --force..."
  php artisan migrate --force
fi

# Laravel caches
log "→ Clearing and rebuilding caches..."
php artisan config:cache
php artisan route:cache
php artisan view:cache
php artisan optimize

# Storage symlink (idempotent)
log "→ php artisan storage:link..."
php artisan storage:link --force 2>/dev/null || true

# Restart queue workers so they pick up new code
log "→ Restarting queue workers..."
php artisan queue:restart 2>/dev/null || true

log "✅ Deploy finished at $(date)"
