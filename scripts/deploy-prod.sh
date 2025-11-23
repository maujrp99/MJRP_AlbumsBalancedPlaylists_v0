#!/usr/bin/env bash
# Deploy the site to Firebase Hosting (production)
# Usage: ./scripts/deploy-prod.sh

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT_DIR"

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
