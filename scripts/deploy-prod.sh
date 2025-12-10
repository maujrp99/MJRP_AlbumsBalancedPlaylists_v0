#!/usr/bin/env bash
# Deploy the site to Firebase Hosting (production)
# Usage: ./scripts/deploy-prod.sh

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT_DIR"

# Convenience: if the user keeps a local key at ../keys/mjrp-service-account.json (sibling folder),
# automatically load it into FIREBASE_SERVICE_ACCOUNT so the script can be run with just
# `./scripts/deploy-prod.sh` from the repo root. This makes local runs ergonomic while
# still allowing CI to provide `FIREBASE_SERVICE_ACCOUNT` or `GOOGLE_APPLICATION_CREDENTIALS`.
if [ -z "${FIREBASE_SERVICE_ACCOUNT:-}" ] && [ -f "$ROOT_DIR/../keys/mjrp-service-account.json" ]; then
  echo "Found local service account at $ROOT_DIR/../keys/mjrp-service-account.json — using for deploy."
  FIREBASE_SERVICE_ACCOUNT="$(cat "$ROOT_DIR/../keys/mjrp-service-account.json")"
  export FIREBASE_SERVICE_ACCOUNT
fi

# Build frontend (Vite)
echo "Building frontend..."
npm run build
if [ $? -ne 0 ]; then
  echo "ERROR: npm run build failed. Aborting deploy."
  exit 1
fi
echo "Build complete. Output in dist/"

# Copy static files that Vite doesn't bundle
echo "Copying static files to dist/..."
mkdir -p dist/js dist/css dist/assets
cp public/js/firebase-config.js dist/js/ 2>/dev/null || echo "Warning: firebase-config.js not found"
cp -r public/css/* dist/css/ 2>/dev/null || true
cp -r public/assets/* dist/assets/ 2>/dev/null || true
cp public/favicon.ico dist/ 2>/dev/null || true
echo "Static files copied."

echo "Preparing production deploy..."

# Determine FIREBASE_PROJECT
if [ -z "${FIREBASE_PROJECT:-}" ]; then
  if [ -f .firebaserc ]; then
    # try to read default project from .firebaserc
    if command -v python3 >/dev/null 2>&1; then
      FIREBASE_PROJECT=$(python3 - <<'PY'
import json,sys
try:
    j=json.load(open('.firebaserc'))
    proj=j.get('projects',{}).get('default')
    if proj:
        print(proj)
except Exception as e:
    sys.exit(1)
PY
)
    fi
  fi
fi

if [ -z "${FIREBASE_PROJECT:-}" ]; then
  echo "ERROR: FIREBASE_PROJECT not set. Export FIREBASE_PROJECT or set it in .firebaserc."
  exit 1
fi

echo "Using Firebase project: $FIREBASE_PROJECT"

# Prefer FIREBASE_TOKEN; if not present, check for GOOGLE_APPLICATION_CREDENTIALS
if [ -z "${FIREBASE_TOKEN:-}" ]; then
  # Support: FIREBASE_SERVICE_ACCOUNT (raw JSON or base64) for CI secrets
  if [ -n "${FIREBASE_SERVICE_ACCOUNT:-}" ]; then
    echo "Using service account from FIREBASE_SERVICE_ACCOUNT env"
    SA_TMP_FILE="$(mktemp)"
    # If the value looks like JSON, write it directly, otherwise try to decode base64
    if command -v jq >/dev/null 2>&1 && echo "$FIREBASE_SERVICE_ACCOUNT" | jq . >/dev/null 2>&1; then
      echo "$FIREBASE_SERVICE_ACCOUNT" > "$SA_TMP_FILE"
    else
      # try base64 decode
      if echo "$FIREBASE_SERVICE_ACCOUNT" | base64 --decode > "$SA_TMP_FILE" 2>/dev/null; then
        : # decoded successfully
      else
        echo "ERROR: FIREBASE_SERVICE_ACCOUNT is neither valid JSON nor base64-encoded JSON"
        rm -f "$SA_TMP_FILE"
        exit 1
      fi
    fi
    export GOOGLE_APPLICATION_CREDENTIALS="$SA_TMP_FILE"
    echo "Wrote temporary service account key to $GOOGLE_APPLICATION_CREDENTIALS"
  fi

  if [ -n "${GOOGLE_APPLICATION_CREDENTIALS:-}" ] && [ -f "$GOOGLE_APPLICATION_CREDENTIALS" ]; then
    echo "Using service account from GOOGLE_APPLICATION_CREDENTIALS"
    # Activate service account for gcloud (optional) - firebase-tools will pick up ADC
    if command -v gcloud >/dev/null 2>&1; then
      gcloud auth activate-service-account --key-file="$GOOGLE_APPLICATION_CREDENTIALS"
    fi
  else
    echo "ERROR: FIREBASE_TOKEN not set and no GOOGLE_APPLICATION_CREDENTIALS found. Set one to proceed."
    exit 1
  fi
fi

echo "Running: npx firebase-tools deploy --only hosting --project $FIREBASE_PROJECT"

# Run the deploy
if [ -n "${FIREBASE_TOKEN:-}" ]; then
  npx firebase-tools deploy --only hosting --project "$FIREBASE_PROJECT" --token "$FIREBASE_TOKEN"
else
  npx firebase-tools deploy --only hosting --project "$FIREBASE_PROJECT"
fi

echo "Deploy command finished. Check Firebase console or hosting URL for changes."
