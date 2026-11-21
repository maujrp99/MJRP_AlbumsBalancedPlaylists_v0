#!/usr/bin/env bash
# Shared by deploy-site.sh and deploy-preview.sh (F87): the .env lookup, the Firebase login check,
# the build, and the checks of what was built. Sourced after lib/deploy-common.sh; not run on its own.

# shellcheck shell=bash

CLIENT_ID_VAR="VITE_SPOTIFY_CLIENT_ID"
ENV_FILE=""
MAIN_SCRIPT=""

# --- preflight ---------------------------------------------------------------

find_env_file() {
  local candidate
  for candidate in "${DEPLOY_ENV_FILE:-}" "${MAIN_CHECKOUT:+$MAIN_CHECKOUT/.env}" "$REPO_ROOT/.env"; do
    if [ -n "$candidate" ] && [ -f "$candidate" ]; then ENV_FILE="$candidate"; return 0; fi
  done
  die "no .env found (looked at DEPLOY_ENV_FILE, the folder where '$DEPLOY_BRANCH' is checked out, and $REPO_ROOT). It must define $CLIENT_ID_VAR; see .env.example."
}

# Prints the value of the client id from the env file. Callers keep it in a
# variable: it is never written to the output.
read_client_id() {
  read_env_value "$CLIENT_ID_VAR" "$1"
}

# Prints the value of a variable of the env file (the last one wins), without quotes. Callers keep
# it in a variable: it is never written to the output.
read_env_value() {
  sed -n "s/^[[:space:]]*$1[[:space:]]*=[[:space:]]*//p" "$2" | tail -1 \
    | tr -d '\r' | sed -e 's/[[:space:]]*$//' -e 's/^"\(.*\)"$/\1/' -e "s/^'\(.*\)'$/\1/"
}

check_firebase_login() {
  step "Checking the Firebase CLI"
  require_tool firebase "Install it (npm install -g firebase-tools) and run 'firebase login'."
  if [ -n "${FIREBASE_TOKEN:-}" ]; then
    ok "using FIREBASE_TOKEN"
  elif [ -n "${GOOGLE_APPLICATION_CREDENTIALS:-}" ]; then
    [ -f "$GOOGLE_APPLICATION_CREDENTIALS" ] || die "GOOGLE_APPLICATION_CREDENTIALS names a file that does not exist"
    ok "using the service account key in GOOGLE_APPLICATION_CREDENTIALS"
  elif firebase login:list 2>/dev/null | grep -q "Logged in as"; then
    ok "the Firebase CLI is logged in"
  else
    die "the Firebase CLI is not logged in. Run 'firebase login' (or set GOOGLE_APPLICATION_CREDENTIALS or FIREBASE_TOKEN)."
  fi
}

# --- build -------------------------------------------------------------------

build_site() {
  step "Building the site (npx vite build)"
  cp "$ENV_FILE" "$SRC_DIR/.env"
  chmod 600 "$SRC_DIR/.env"
  local log="$WORK_DIR/vite-build.log"
  if ( cd "$SRC_DIR" && npx vite build ) >"$log" 2>&1; then
    grep -E 'modules transformed|built in' "$log" | sed 's/^ */    /' || true
  else
    tail -60 "$log" >&2
    die "the build failed: nothing was deployed"
  fi

  # Vite bundles only what public/index.html (the app) and public/splash.html (the entry
  # page, F80) import. The rest of what the site
  # serves is copied as it is: the Firebase configuration, the stylesheets linked
  # by path, the images and data under assets, and the old .ico icon.
  step "Copying what Vite does not bundle"
  mkdir -p "$SRC_DIR/dist/js" "$SRC_DIR/dist/css" "$SRC_DIR/dist/assets"
  cp "$SRC_DIR/public/js/firebase-config.js" "$SRC_DIR/dist/js/" \
    || die "public/js/firebase-config.js is missing from '$DEPLOY_BRANCH': the site cannot reach Firebase without it"
  cp -R "$SRC_DIR/public/css/." "$SRC_DIR/dist/css/"
  cp -R "$SRC_DIR/public/assets/." "$SRC_DIR/dist/assets/"
  cp "$SRC_DIR/public/favicon.ico" "$SRC_DIR/dist/"
  ok "firebase-config.js, css/, assets/ and favicon.ico copied to dist/"
}

# --- verification of what was built -----------------------------------------

# Prints the path of the main script named by a page read from stdin.
# F80: in dist/ the app is app.html; index.html is the entry page served at the root.
main_script_of() {
  grep -oE '<script[^>]*src="/assets/[^"]+\.js"' | grep -oE '/assets/[^"]+\.js' | head -1
}

verify_build() {
  step "Verifying what was built"
  local dist="$SRC_DIR/dist" client_id maps missing ref path page

  [ -f "$dist/app.html" ] || die "dist/app.html (the app) was not built"
  [ -f "$dist/index.html" ] || die "dist/index.html (the entry page) was not built"
  [ ! -f "$dist/splash.html" ] || die "dist/splash.html is still there: the entry page was not put at the root"
  grep -q 'data-page="entry"' "$dist/index.html" || die "dist/index.html is not the entry page"

  MAIN_SCRIPT="$(main_script_of < "$dist/app.html")"
  [ -n "$MAIN_SCRIPT" ] || die "dist/app.html names no main script under /assets/"
  [ -s "$dist$MAIN_SCRIPT" ] || die "the main script named by app.html does not exist: $MAIN_SCRIPT"
  ok "main script: $MAIN_SCRIPT"

  client_id="$(read_client_id "$ENV_FILE")"
  [ -n "$client_id" ] || die "$CLIENT_ID_VAR is empty in $ENV_FILE"
  grep -rqF --include='*.js' -- "$client_id" "$dist/assets" \
    || die "the built scripts do not contain the Spotify client id: Spotify would break in production"
  ok "the Spotify client id is in the built scripts"

  verify_usage_measurement "$dist"

  maps="$(find "$dist" -name '*.map' | wc -l | tr -d ' ')"
  [ "$maps" = "0" ] || die "$maps source map file(s) in dist/: the site must not hand out its source"
  ok "no .map files"

  # Every local file the two pages point to must be in dist. Firebase answers a
  # missing path with app.html (status 200), so a missing file is silent in production.
  # An address of the app (no extension: /start, /start?signin) is not a file.
  missing=0
  for page in app.html index.html; do
    for ref in $(grep -oE '(src|href)="/[^"/][^"]*"' "$dist/$page" | sed -E 's/^(src|href)="//; s/"$//; s/[?#].*$//' | grep -E '\.[a-z0-9]+$' | sort -u); do
      if [ ! -f "$dist$ref" ]; then warn "$page points to a file that is not in dist: $ref"; missing=1; fi
    done
  done
  [ "$missing" -eq 0 ] || die "the build is incomplete"
  ok "every local file named by app.html and index.html is in dist/"

  # Everything under public/css and public/assets must have arrived.
  missing=0
  while IFS= read -r path; do
    if [ ! -f "$dist/${path#"$SRC_DIR/public/"}" ]; then warn "not copied to dist: ${path#"$SRC_DIR/public/"}"; missing=1; fi
  done <<EOF
$(find "$SRC_DIR/public/css" "$SRC_DIR/public/assets" -type f)
EOF
  [ "$missing" -eq 0 ] || die "the build is incomplete"
  [ -f "$dist/js/firebase-config.js" ] || die "dist/js/firebase-config.js is missing"
  ok "css/, assets/ and js/firebase-config.js are complete ($(find "$dist" -type f | wc -l | tr -d ' ') files in dist/)"
}

# The measurement of use (F77): on only with VITE_POSTHOG_KEY, unless VITE_USAGE_MEASUREMENT=off.
# Says which way the site was built; a key that did not reach the built scripts is refused.
verify_usage_measurement() {
  local dist="$1" key switch
  key="$(read_env_value VITE_POSTHOG_KEY "$ENV_FILE")"
  switch="$(read_env_value VITE_USAGE_MEASUREMENT "$ENV_FILE" | tr '[:upper:]' '[:lower:]')"
  if [ -z "$key" ]; then
    ok "measurement of use: OFF (no VITE_POSTHOG_KEY): the site measures nothing"
  elif [ "$switch" = "off" ]; then
    ok "measurement of use: OFF (VITE_USAGE_MEASUREMENT=off)"
  else
    grep -rqF --include='*.js' -- "$key" "$dist/assets" \
      || die "VITE_POSTHOG_KEY is set but the built scripts do not contain it: the measurement would not start"
    ok "measurement of use: ON (the PostHog project key is in the built scripts)"
  fi
}
