#!/usr/bin/env bash
# Publish the server (Cloud Run service mjrp-proxy) from committed `main`. The one way (F64).
#
# Usage:
#   ./scripts/deploy-server.sh             test, stage, verify, deploy, verify production
#   ./scripts/deploy-server.sh --dry-run   everything except the deploy and the production checks
#   ./scripts/deploy-server.sh --keep      do not remove the temporary folder at the end
#
# Needs on this machine:
#   - gcloud, logged in (`gcloud auth login`) as someone who can deploy to the project.
#     A service account is accepted instead, when present:
#     GOOGLE_APPLICATION_CREDENTIALS=<key file> (used for this run only).
#
# The image is built by Cloud Build from server/Dockerfile (`gcloud run deploy --source`).
# This script is the only recipe: it stages what the Dockerfile expects next to the
# server code (the shared modules and the prompts). The service keeps its environment
# variables and secrets from one revision to the next; this script sets none.
#
# It never builds from the working folder and never writes inside the repository.

set -euo pipefail

# shellcheck source=lib/deploy-common.sh
. "$(cd "$(dirname "$0")" && pwd)/lib/deploy-common.sh"

SERVICE="${SERVICE:-mjrp-proxy}"
REGION="${REGION:-southamerica-east1}"
PREVIOUS_REVISION=""
SERVICE_URL=""
SMOKE_PID=""

usage() {
  sed -n '2,8p' "$0" | sed 's/^# \{0,1\}//'
}

gcloud_run() {
  gcloud run "$@" --region "$REGION" --project "$GCP_PROJECT"
}

# --- preflight ---------------------------------------------------------------

check_gcloud_login() {
  step "Checking gcloud"
  require_tool gcloud "Install the Google Cloud CLI and run 'gcloud auth login'."
  if [ -n "${GOOGLE_APPLICATION_CREDENTIALS:-}" ]; then
    [ -f "$GOOGLE_APPLICATION_CREDENTIALS" ] || die "GOOGLE_APPLICATION_CREDENTIALS names a file that does not exist"
    # For this run only: the login stored on the machine is left as it is.
    export CLOUDSDK_AUTH_CREDENTIAL_FILE_OVERRIDE="$GOOGLE_APPLICATION_CREDENTIALS"
    ok "using the service account key in GOOGLE_APPLICATION_CREDENTIALS"
  elif [ -n "$(gcloud auth list --filter=status:ACTIVE --format='value(account)' 2>/dev/null)" ]; then
    ok "gcloud is logged in"
  else
    die "gcloud is not logged in. Run 'gcloud auth login' (or set GOOGLE_APPLICATION_CREDENTIALS)."
  fi
}

# Reads the service as it is now: the revision that serves (the way back) and the address.
# Prints lines "revision percent" for the revisions receiving traffic, most traffic first.
read_service() {
  gcloud_run services describe "$SERVICE" --format=json 2>/dev/null | node -e '
    let raw = ""
    process.stdin.on("data", d => { raw += d }).on("end", () => {
      const s = JSON.parse(raw).status || {}
      console.log("url " + (s.url || ""))
      console.log("latest " + (s.latestReadyRevisionName || ""))
      const traffic = (s.traffic || []).filter(t => t.percent > 0).sort((a, b) => b.percent - a.percent)
      for (const t of traffic) console.log("traffic " + t.revisionName + " " + t.percent)
    })'
}

record_previous_revision() {
  step "Reading the revision in production now (the way back)"
  local state
  if ! state="$(read_service)" || [ -z "$state" ]; then
    if [ "$DRY_RUN" -eq 1 ]; then
      warn "could not read the service $SERVICE (dry run: going on without it)"
      return 0
    fi
    die "could not read the service $SERVICE in $REGION: without the current revision there is no way back to print"
  fi
  SERVICE_URL="$(printf '%s\n' "$state" | awk '$1 == "url" { print $2 }')"
  PREVIOUS_REVISION="$(printf '%s\n' "$state" | awk '$1 == "traffic" { print $2; exit }')"
  [ -n "$PREVIOUS_REVISION" ] || PREVIOUS_REVISION="$(printf '%s\n' "$state" | awk '$1 == "latest" { print $2 }')"
  printf '%s\n' "$state" | awk '$1 == "traffic" { printf "    serving now: %s (%s%%)\n", $2, $3 }'
  [ -n "$PREVIOUS_REVISION" ] || die "the service $SERVICE has no ready revision"
  ok "way back: $PREVIOUS_REVISION"
}

# --- staging -----------------------------------------------------------------

# The Dockerfile builds from the server folder alone. What the server needs from
# outside it is copied in first: shared/ (ES modules, hence the package.json) as
# _shared_temp, which the Dockerfile places beside the app, and config/ (the prompts).
stage_server() {
  step "Staging the build context (server/ plus shared/ and config/)"
  [ ! -e "$SRC_DIR/server/_shared_temp" ] || die "server/_shared_temp is committed on '$DEPLOY_BRANCH': it must only exist while staging"
  [ ! -e "$SRC_DIR/server/config" ] || die "server/config is committed on '$DEPLOY_BRANCH': it must only exist while staging"
  cp -R "$SRC_DIR/shared" "$SRC_DIR/server/_shared_temp"
  printf '{"type": "module"}\n' > "$SRC_DIR/server/_shared_temp/package.json"
  cp -R "$SRC_DIR/config" "$SRC_DIR/server/config"
  ok "shared/ -> server/_shared_temp (marked as ES modules), config/ -> server/config"
}

# --- verification of what will be sent --------------------------------------

image_node_major() {
  sed -n 's/^FROM node:\([0-9][0-9]*\).*/\1/p' "$SRC_DIR/server/Dockerfile" | head -1
}

stop_smoke_server() {
  if [ -n "$SMOKE_PID" ] && kill -0 "$SMOKE_PID" 2>/dev/null; then
    kill "$SMOKE_PID" 2>/dev/null || true
    wait "$SMOKE_PID" 2>/dev/null || true
  fi
  SMOKE_PID=""
}

verify_context() {
  step "Verifying the build context"
  local ctx="$SRC_DIR/server" f
  for f in Dockerfile index.js package.json package-lock.json config/prompts.json _shared_temp/package.json; do
    [ -s "$ctx/$f" ] || die "missing from the build context: server/$f"
  done
  [ ! -e "$ctx/.env" ] || die "server/.env is in the build context: secrets must not be sent with the source"
  [ ! -e "$ctx/node_modules" ] || die "server/node_modules is in the build context"
  ok "Dockerfile, index.js, the lockfile, config/prompts.json and the shared modules are in place; no .env"

  # Start the server from a copy laid out as the image lays it out, with the
  # locked production dependencies and no secrets, and ask it the two questions
  # production is asked after the deploy. No paid route is called.
  step "Starting the staged server locally (as the image lays it out)"
  local smoke="$WORK_DIR/smoke" port log="$WORK_DIR/smoke-server.log" local_major image_major attempt status
  mkdir -p "$smoke/app"
  cp -R "$ctx/." "$smoke/app/"
  cp -R "$ctx/_shared_temp" "$smoke/shared"   # Dockerfile: COPY _shared_temp ../shared
  ( cd "$smoke/app" && npm ci --omit=dev --no-audit --no-fund --loglevel=error ) >"$WORK_DIR/smoke-npm.log" 2>&1 \
    || { tail -30 "$WORK_DIR/smoke-npm.log" >&2; die "npm ci --omit=dev failed for the server (is server/package-lock.json in step with server/package.json?)"; }

  local_major="$(node -p 'process.versions.node.split(".")[0]')"
  image_major="$(image_node_major)"
  [ -n "$image_major" ] || die "server/Dockerfile does not start from a node:<version> image"
  if [ "$local_major" = "$image_major" ]; then
    info "Node $local_major here, Node $image_major in the image"
  else
    warn "this machine runs Node $local_major and the image runs Node $image_major: the local start proves the code and its dependencies, not the image's Node version"
  fi

  port="$(node -e 'const s = require("net").createServer(); s.listen(0, "127.0.0.1", () => { console.log(s.address().port); s.close() })')"
  ( cd "$smoke/app" && exec env -i PATH="$PATH" HOME="$HOME" NODE_ENV=production PORT="$port" node index.js ) >"$log" 2>&1 &
  SMOKE_PID=$!

  status="000"
  for attempt in 1 2 3 4 5 6 7 8 9 10 11 12 13 14 15 16 17 18 19 20; do
    kill -0 "$SMOKE_PID" 2>/dev/null || break
    status="$(fetch_status "http://127.0.0.1:$port/_health")"
    [ "$status" = "200" ] && break
    sleep 0.5
  done
  if [ "$status" != "200" ]; then
    stop_smoke_server
    tail -40 "$log" >&2
    die "the staged server did not start"
  fi
  ok "the server started and answers /_health"

  status="$(fetch_status "http://127.0.0.1:$port/api/musickit-status")"
  [ "$status" = "200" ] || { stop_smoke_server; die "/api/musickit-status answered $status locally (expected 200)"; }
  ok "/api/musickit-status answers 200"
  status="$(fetch_status "http://127.0.0.1:$port/api/debug/files")"
  [ "$status" = "404" ] || { stop_smoke_server; die "/api/debug/files answered $status locally (expected 404: the debug routes must be closed)"; }
  ok "/api/debug/files answers 404 (debug routes closed)"

  stop_smoke_server
  if grep -qiE "could not load|cannot find module|ERR_MODULE_NOT_FOUND|ERR_REQUIRE_ESM" "$log"; then
    tail -40 "$log" >&2
    die "the staged server reported a missing file or module while starting"
  fi
  ok "no missing file or module in the start log"

  # The prompts and the shared modules are only read when a route needs them, so
  # starting is not enough: load them the way the server does, from the same layout.
  ( cd "$smoke/app" && node -e '
    const fs = require("fs")
    const prompts = require("./lib/prompts").loadPrompts()
    if (!prompts || Object.keys(prompts).length === 0) { console.error("config/prompts.json was not loaded"); process.exit(1) }
    const shared = fs.readdirSync("../shared").filter(f => f.endsWith(".js"))
    if (shared.length === 0) { console.error("no shared module found"); process.exit(1) }
    Promise.all(shared.map(f => import("../shared/" + f)))
      .then(() => console.log(Object.keys(prompts).length + " prompt group(s), " + shared.length + " shared modules"))
      .catch(e => { console.error(e.message); process.exit(1) })
  ' ) >"$WORK_DIR/smoke-load.log" 2>&1 \
    || { cat "$WORK_DIR/smoke-load.log" >&2; die "the staged server cannot load its prompts or its shared modules"; }
  ok "loaded from the image layout: $(cat "$WORK_DIR/smoke-load.log")"
}

# --- deploy and verification of production ----------------------------------

print_rollback() {
  local target="${PREVIOUS_REVISION:-<previous revision>}"
  cat <<EOF

How to roll back the server (sends all traffic back to the revision that served before this deploy):
  gcloud run services update-traffic $SERVICE --to-revisions=$target=100 --region $REGION --project $GCP_PROJECT
After a rollback the service stays pinned to that revision. Before the next deploy, release it:
  gcloud run services update-traffic $SERVICE --to-latest --region $REGION --project $GCP_PROJECT
EOF
}

deploy_server() {
  step "Deploying to Cloud Run ($SERVICE, $REGION, project $GCP_PROJECT)"
  ( cd "$SRC_DIR" && gcloud run deploy "$SERVICE" --source server --region "$REGION" --project "$GCP_PROJECT" --allow-unauthenticated ) \
    || { print_rollback; die "gcloud run deploy failed. When the new revision does not start, Cloud Run keeps the previous one serving; check with: gcloud run services describe $SERVICE --region $REGION --project $GCP_PROJECT"; }
}

verify_production() {
  step "Verifying production"
  local state new_revision serving serving_percent attempt status
  state="$(read_service)" || { print_rollback; die "could not read the service after the deploy"; }
  SERVICE_URL="$(printf '%s\n' "$state" | awk '$1 == "url" { print $2 }')"
  new_revision="$(printf '%s\n' "$state" | awk '$1 == "latest" { print $2 }')"
  serving="$(printf '%s\n' "$state" | awk '$1 == "traffic" { print $2; exit }')"
  serving_percent="$(printf '%s\n' "$state" | awk '$1 == "traffic" { print $3; exit }')"

  if [ "$new_revision" = "$PREVIOUS_REVISION" ]; then
    print_rollback
    die "the latest ready revision is still $PREVIOUS_REVISION: the deploy created no new revision"
  fi
  if [ "$serving" != "$new_revision" ] || [ "$serving_percent" != "100" ]; then
    print_rollback
    die "the new revision $new_revision is ready but traffic goes to $serving ($serving_percent%). The service is pinned; release it with: gcloud run services update-traffic $SERVICE --to-latest --region $REGION --project $GCP_PROJECT"
  fi
  ok "new revision $new_revision serves 100% of the traffic"

  for attempt in 1 2 3 4 5 6; do
    status="$(fetch_status "$SERVICE_URL/api/musickit-status")"
    [ "$status" = "200" ] && break
    sleep 5
  done
  [ "$status" = "200" ] || { print_rollback; die "$SERVICE_URL/api/musickit-status answered $status (expected 200)"; }
  ok "/api/musickit-status answers 200"

  status="$(fetch_status "$SERVICE_URL/api/debug/files")"
  [ "$status" = "404" ] || { print_rollback; die "$SERVICE_URL/api/debug/files answered $status (expected 404: the debug routes must be closed)"; }
  ok "/api/debug/files answers 404 (debug routes closed)"
}

# --- main --------------------------------------------------------------------

parse_common_args "$@"
require_tool git "It is needed to export '$DEPLOY_BRANCH'."
require_tool node "Install Node.js."
require_tool npm "Install Node.js (npm comes with it)."
require_tool curl "It is needed to check the server."
locate_repo

if [ "$DRY_RUN" -eq 1 ]; then printf 'DRY RUN: nothing will be deployed.\n'; fi
printf 'Server deploy from %s, branch %s\n' "$REPO_ROOT" "$DEPLOY_BRANCH"

require_clean_main
check_gcloud_login
record_previous_revision

make_work_dir deploy-server
trap 'stop_smoke_server; cleanup_work_dir' EXIT
export_main
install_root_dependencies
run_unit_tests
stage_server
verify_context

if [ "$DRY_RUN" -eq 1 ]; then
  step "Deploy skipped (dry run)"
  info "would run, in the clean copy: gcloud run deploy $SERVICE --source server --region $REGION --project $GCP_PROJECT --allow-unauthenticated"
  info "would then check that /api/musickit-status answers 200 and /api/debug/files answers 404 in production"
  print_rollback
  print_dry_run_end
  exit 0
fi

deploy_server
verify_production
print_rollback
printf '\nServer published from %s (%s).\n' "$DEPLOY_BRANCH" "$(git -C "$REPO_ROOT" rev-parse --short "$MAIN_SHA")"
