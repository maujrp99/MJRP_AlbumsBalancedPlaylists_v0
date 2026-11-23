#!/usr/bin/env bash
# Publish the site (Firebase Hosting) from committed `main`. The one way (F64).
#
# Usage:
#   ./scripts/deploy-site.sh             test, build, verify, deploy, verify production
#   ./scripts/deploy-site.sh --dry-run   everything except the deploy and the production checks
#   ./scripts/deploy-site.sh --keep      do not remove the temporary folder at the end
#
# Needs on this machine:
#   - a `.env` with VITE_SPOTIFY_CLIENT_ID, in the folder where `main` is checked out
#     (or the file named by DEPLOY_ENV_FILE). Vite reads it at build time; without it
#     the Spotify connection breaks in production.
#   - the Firebase CLI, logged in (`firebase login`). A service account is accepted
#     instead, when present: GOOGLE_APPLICATION_CREDENTIALS=<key file>, or FIREBASE_TOKEN.
#
# It never builds from the working folder and never writes inside the repository.

set -euo pipefail

# shellcheck source=lib/deploy-common.sh
. "$(cd "$(dirname "$0")" && pwd)/lib/deploy-common.sh"
# shellcheck source=lib/site-build.sh
. "$(cd "$(dirname "$0")" && pwd)/lib/site-build.sh"

SITE_URL="${SITE_URL:-https://$GCP_PROJECT.web.app}"
usage() {
  sed -n '2,8p' "$0" | sed 's/^# \{0,1\}//'
}


# --- deploy and verification of production ----------------------------------

deploy_site() {
  step "Deploying to Firebase Hosting (project $GCP_PROJECT)"
  if [ -n "${FIREBASE_TOKEN:-}" ]; then
    ( cd "$SRC_DIR" && firebase deploy --only hosting --project "$GCP_PROJECT" --non-interactive --token "$FIREBASE_TOKEN" )
  else
    ( cd "$SRC_DIR" && firebase deploy --only hosting --project "$GCP_PROJECT" --non-interactive )
  fi || die "firebase deploy failed. Production may or may not have changed: open $SITE_URL and the Hosting release history."
}

print_rollback() {
  cat <<EOF

How to roll back the site:
  Firebase console > Hosting > release history, pick the previous release, "Rollback":
  https://console.firebase.google.com/project/$GCP_PROJECT/hosting/sites
  (Every deploy is kept there as a version; rolling back is immediate and needs no build.)
EOF
}

verify_production() {
  step "Verifying production ($SITE_URL)"
  local attempt live_script="" head_bytes country
  for attempt in 1 2 3 4 5 6; do
    live_script="$(curl -fsS --max-time 30 -H 'Cache-Control: no-cache' "$SITE_URL/app.html" 2>/dev/null | main_script_of || true)"
    [ "$live_script" = "$MAIN_SCRIPT" ] && break
    sleep 5
  done
  if [ "$live_script" != "$MAIN_SCRIPT" ]; then
    print_rollback
    die "the live app.html names '$live_script', not the script just built ('$MAIN_SCRIPT')"
  fi
  ok "the live app.html names the script just built: $MAIN_SCRIPT"

  # A missing file is answered with app.html and status 200: look at the content.
  head_bytes="$(curl -fsS --max-time 30 "$SITE_URL$MAIN_SCRIPT" 2>/dev/null | head -c 200 | tr '[:upper:]' '[:lower:]' || true)"
  case "$head_bytes" in
    "") print_rollback; die "the live main script did not answer: $SITE_URL$MAIN_SCRIPT" ;;
    *"<!doctype"*|*"<html"*) print_rollback; die "the live main script answers with a page, not a script: $SITE_URL$MAIN_SCRIPT" ;;
  esac
  ok "the live main script is served as a script"

  # The country hint (F81). A missing /country.json is answered with app.html and status 200: look at the content.
  country="$(curl -fsS --max-time 30 "$SITE_URL/country.json" 2>/dev/null | country_hint_of)" \
    || { print_rollback; die "the live /country.json is not the country hint: the app cannot tell Brazil from elsewhere ($SITE_URL/country.json)"; }
  ok "the live /country.json is the country hint (from here it says: '${country:-no country}')"
  # The same address as a visitor in Brazil, told with the test cookie of Firebase Hosting. A warning, not a refusal:
  # the site works without it (everybody gets the language of «another country»).
  country="$(curl -fsS --max-time 30 --cookie 'firebase-country-override=br' "$SITE_URL/country.json" 2>/dev/null | country_hint_of || true)"
  if [ "$country" = "br" ]; then ok "to a visitor in Brazil the live /country.json answers Brazil"
  else warn "the live /country.json does not answer Brazil to a visitor in Brazil (it says '$country'): check hosting.i18n in firebase.json and dist/geo/ALL_br/"; fi
}

# --- main --------------------------------------------------------------------

parse_common_args "$@"
require_tool git "It is needed to export '$DEPLOY_BRANCH'."
require_tool node "Install Node.js."
require_tool npm "Install Node.js (npm comes with it)."
require_tool curl "It is needed to check production."
locate_repo

if [ "$DRY_RUN" -eq 1 ]; then printf 'DRY RUN: nothing will be deployed.\n'; fi
printf 'Site deploy from %s, branch %s\n' "$REPO_ROOT" "$DEPLOY_BRANCH"

require_clean_main
step "Looking for the .env with $CLIENT_ID_VAR"
find_env_file
[ -n "$(read_client_id "$ENV_FILE")" ] || die "$CLIENT_ID_VAR is missing or empty in $ENV_FILE"
ok "$ENV_FILE defines $CLIENT_ID_VAR"
check_firebase_login

make_work_dir deploy-site
export_main
install_root_dependencies
run_lint
run_unit_tests
build_site
verify_build

if [ "$DRY_RUN" -eq 1 ]; then
  step "Deploy skipped (dry run)"
  info "would run, in the clean copy: firebase deploy --only hosting --project $GCP_PROJECT"
  info "would then check that $SITE_URL/app.html names $MAIN_SCRIPT"
  print_rollback
  print_dry_run_end
  exit 0
fi

deploy_site
verify_production
print_rollback
printf '\nSite published from %s (%s).\n' "$DEPLOY_BRANCH" "$(git -C "$REPO_ROOT" rev-parse --short "$MAIN_SHA")"
