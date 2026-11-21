#!/usr/bin/env bash
# Publish the site on a Firebase Hosting PREVIEW CHANNEL, apart from production (F87, slice A).
#
# Usage:
#   ./scripts/deploy-preview.sh [channel]             test, build, verify, publish the preview (channel: staging)
#   ./scripts/deploy-preview.sh --dry-run [channel]   everything except the publication
#   ./scripts/deploy-preview.sh --keep                do not remove the temporary folder at the end
#
# Same checks as deploy-site.sh (lint, tests, build, bundle checks) run first; the last step is
# `firebase hosting:channel:deploy <channel> --expires 7d` for the same Hosting site. The preview
# uses production's data, login and server: it only puts the site at another address. The channel
# expires in 7 days. The address is printed at the end. It never runs `firebase deploy`, so
# production is not touched. Needs the same .env and Firebase login as deploy-site.sh.

set -euo pipefail

# shellcheck source=lib/deploy-common.sh
. "$(cd "$(dirname "$0")" && pwd)/lib/deploy-common.sh"
# shellcheck source=lib/site-build.sh
. "$(cd "$(dirname "$0")" && pwd)/lib/site-build.sh"

CHANNEL="staging"
PREVIEW_URL=""

usage() {
  sed -n '2,13p' "$0" | sed 's/^# \{0,1\}//'
}

# Separates the channel name from the flags the common parser understands.
parse_preview_args() {
  local rest=() arg
  for arg in "$@"; do
    case "$arg" in
      --dry-run|--keep|-h|--help) rest+=("$arg") ;;
      -*) usage >&2; die "unknown argument: $arg" ;;
      *) CHANNEL="$arg" ;;
    esac
  done
  parse_common_args ${rest[@]+"${rest[@]}"}
  case "$CHANNEL" in
    live) die "'live' is the production channel; a preview never uses it" ;;
  esac
  printf '%s' "$CHANNEL" | grep -Eq '^[a-z0-9][a-z0-9-]{0,62}$' \
    || die "the channel name '$CHANNEL' must be lower case letters, digits and hyphens"
}

deploy_preview() {
  step "Publishing the preview channel '$CHANNEL' (project $GCP_PROJECT, expires in 7 days)"
  local log="$WORK_DIR/preview-deploy.log"
  if [ -n "${FIREBASE_TOKEN:-}" ]; then
    ( cd "$SRC_DIR" && firebase hosting:channel:deploy "$CHANNEL" --expires 7d --project "$GCP_PROJECT" --non-interactive --token "$FIREBASE_TOKEN" ) 2>&1 | tee "$log" || true
  else
    ( cd "$SRC_DIR" && firebase hosting:channel:deploy "$CHANNEL" --expires 7d --project "$GCP_PROJECT" --non-interactive ) 2>&1 | tee "$log" || true
  fi
  PREVIEW_URL="$(grep -oE 'https://[A-Za-z0-9.-]+\.(web\.app|firebaseapp\.com)[^[:space:]]*' "$log" | grep -- "--" | head -1 || true)"
  [ -n "$PREVIEW_URL" ] || die "firebase did not print a preview address. The preview may or may not exist: see the Hosting page of the console. Production was not touched."
}

# --- main --------------------------------------------------------------------

parse_preview_args "$@"
require_tool git "It is needed to export '$DEPLOY_BRANCH'."
require_tool node "Install Node.js."
require_tool npm "Install Node.js (npm comes with it)."
locate_repo

if [ "$DRY_RUN" -eq 1 ]; then printf 'DRY RUN: nothing will be published.\n'; fi
printf 'Preview deploy (channel %s) from %s, branch %s\n' "$CHANNEL" "$REPO_ROOT" "$DEPLOY_BRANCH"

require_clean_main
step "Looking for the .env with $CLIENT_ID_VAR"
find_env_file
[ -n "$(read_client_id "$ENV_FILE")" ] || die "$CLIENT_ID_VAR is missing or empty in $ENV_FILE"
ok "$ENV_FILE defines $CLIENT_ID_VAR"
check_firebase_login

make_work_dir deploy-preview
export_main
install_root_dependencies
run_lint
run_unit_tests
build_site
verify_build

if [ "$DRY_RUN" -eq 1 ]; then
  step "Publication skipped (dry run)"
  info "would run, in the clean copy: firebase hosting:channel:deploy $CHANNEL --expires 7d --project $GCP_PROJECT"
  print_dry_run_end
  exit 0
fi

deploy_preview
printf '\nPreview address: %s\n' "$PREVIEW_URL"
printf 'Expires in 7 days. It shares production data, login and server. Add the address to the authorized domains of Firebase Auth if sign-in is refused (the CLI syncs them unless told not to).\n'
printf 'Preview published from %s (%s). Production was not touched.\n' "$DEPLOY_BRANCH" "$(git -C "$REPO_ROOT" rev-parse --short "$MAIN_SHA")"
