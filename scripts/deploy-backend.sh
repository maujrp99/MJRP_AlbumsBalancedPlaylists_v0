#!/usr/bin/env bash
# Deploy the backend to Cloud Run
# Usage: ./scripts/deploy-backend.sh

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT_DIR"

# Load service account if present (same logic as deploy-prod.sh)
if [ -z "${FIREBASE_SERVICE_ACCOUNT:-}" ] && [ -f "$ROOT_DIR/../keys/mjrp-service-account.json" ]; then
  echo "Found local service account at $ROOT_DIR/../keys/mjrp-service-account.json — using for deploy."
  export GOOGLE_APPLICATION_CREDENTIALS="$ROOT_DIR/../keys/mjrp-service-account.json"
fi

PROJECT_ID="mjrp-playlist-generator"
REGION="southamerica-east1"
SERVICE_NAME="mjrp-proxy"

echo "Deploying backend to Cloud Run..."
echo "Project: $PROJECT_ID"
echo "Region: $REGION"
echo "Service: $SERVICE_NAME"

# Copy shared module to server context
echo "Staging shared module..."
cp -r shared server/_shared_temp
# Ensure shared module is treated as ESM
echo '{"type": "module"}' > server/_shared_temp/package.json

# Copy config to server context
echo "Staging config..."
cp -r config server/config

gcloud run deploy "$SERVICE_NAME" \
  --source server \
  --region "$REGION" \
  --project "$PROJECT_ID" \
  --allow-unauthenticated

# Cleanup
rm -rf server/_shared_temp
rm -rf server/config

echo "Backend deploy complete!"
