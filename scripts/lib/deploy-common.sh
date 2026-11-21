#!/usr/bin/env bash
# Shared steps of the one way to production (F64). Sourced by deploy-site.sh and
# deploy-server.sh; not meant to be run on its own.
#
# What lives here is what both deploys must do the same way:
#   - refuse to run when local `main` has uncommitted changes to tracked files;
#   - build from a clean export of `main`, in a folder under the system temp
#     directory, never from the working folder;
#   - run the unit tests and stop when one fails;
#   - remove the temporary folder at the end (never anything inside the repository).

# shellcheck shell=bash

DEPLOY_BRANCH="main"
GCP_PROJECT="${GCP_PROJECT:-mjrp-playlist-generator}"

DRY_RUN=0
KEEP_WORK=0
WORK_DIR=""
SRC_DIR=""
REPO_ROOT=""
MAIN_SHA=""
MAIN_CHECKOUT=""

step() { printf '\n==> %s\n' "$*"; }
info() { printf '    %s\n' "$*"; }
ok()   { printf '    ok: %s\n' "$*"; }
warn() { printf '    WARNING: %s\n' "$*" >&2; }
die()  { printf '\nERROR: %s\n' "$*" >&2; exit 1; }

# parse_common_args "$@" -- understands --dry-run, --keep and --help.
# The calling script defines usage().
parse_common_args() {
  while [ $# -gt 0 ]; do
    case "$1" in
      --dry-run) DRY_RUN=1 ;;
      --keep) KEEP_WORK=1 ;;
      -h|--help) usage; exit 0 ;;
      *) usage >&2; die "unknown argument: $1" ;;
    esac
    shift
  done
}

require_tool() {
  command -v "$1" >/dev/null 2>&1 || die "'$1' was not found on this machine. $2"
}

# Finds the repository this script belongs to. Any checkout of the repository
# works (the main folder or a worktree): the source is always the `main` branch.
locate_repo() {
  local script_dir
  script_dir="$(cd "$(dirname "${BASH_SOURCE[1]}")" && pwd)"
  REPO_ROOT="$(git -C "$script_dir" rev-parse --show-toplevel 2>/dev/null)" \
    || die "this script must live inside the git repository"
  MAIN_SHA="$(git -C "$REPO_ROOT" rev-parse --verify --quiet "refs/heads/$DEPLOY_BRANCH")" \
    || die "there is no local branch named '$DEPLOY_BRANCH' in this repository. Only local branches can be published (check: git branch --list)."
  # The folder where `main` is checked out, if any (worktrees included).
  MAIN_CHECKOUT="$(git -C "$REPO_ROOT" worktree list --porcelain | awk -v want="refs/heads/$DEPLOY_BRANCH" '
    /^worktree / { path = substr($0, 10) }
    /^branch /   { if (substr($0, 8) == want) { print path; exit } }')"
}

# Production is built from committed `main`. Uncommitted changes to tracked files
# in the folder where `main` is checked out would be left out without a word, so
# the deploy refuses instead. Untracked files are never part of the export.
require_clean_main() {
  step "Checking that local '$DEPLOY_BRANCH' has no uncommitted changes"
  if [ -z "$MAIN_CHECKOUT" ]; then
    ok "'$DEPLOY_BRANCH' is not checked out in any folder: nothing can be uncommitted"
    return 0
  fi
  local dirty
  dirty="$(git --no-optional-locks -C "$MAIN_CHECKOUT" status --porcelain --untracked-files=no)" \
    || die "could not read the git status of $MAIN_CHECKOUT"
  if [ -n "$dirty" ]; then
    printf '%s\n' "$dirty" | head -20 >&2
    die "'$DEPLOY_BRANCH' has uncommitted changes to tracked files in $MAIN_CHECKOUT. Commit them (or set them aside) first: production is built from committed '$DEPLOY_BRANCH' only."
  fi
  ok "clean ($MAIN_CHECKOUT)"
}

# Creates the temporary folder under the system temp directory and registers its
# removal for when the script ends, however it ends.
make_work_dir() {
  local label="$1" base repo_real
  base="$(cd "${TMPDIR:-/tmp}" 2>/dev/null && pwd -P)" || die "the system temp directory is not usable"
  repo_real="$(cd "$REPO_ROOT" && pwd -P)"
  case "$base/" in
    "$repo_real"/*) die "the temp directory ($base) is inside the repository; set TMPDIR to a folder outside it" ;;
  esac
  WORK_DIR="$(mktemp -d "$base/mjrp-$label.XXXXXXXX")" || die "could not create a temporary folder in $base"
  SRC_DIR="$WORK_DIR/src"
  mkdir "$SRC_DIR"
  trap cleanup_work_dir EXIT
  trap 'exit 130' INT
  trap 'exit 143' TERM
}

cleanup_work_dir() {
  if [ -z "$WORK_DIR" ] || [ ! -d "$WORK_DIR" ]; then return 0; fi
  if [ "$KEEP_WORK" -eq 1 ]; then
    printf '\nTemporary folder kept (--keep): %s\n' "$WORK_DIR"
    return 0
  fi
  # Only ever remove the folder this run created with mktemp.
  case "$(basename "$WORK_DIR")" in
    mjrp-deploy-*.????????) rm -rf -- "$WORK_DIR" ;;
    *) warn "temporary folder has an unexpected name, left in place: $WORK_DIR" ;;
  esac
}

# Exports committed `main` into the temporary folder: tracked files only, as committed.
export_main() {
  step "Exporting a clean copy of '$DEPLOY_BRANCH'"
  info "commit: $(git -C "$REPO_ROOT" log -1 --format='%h %s' "$MAIN_SHA")"
  git -C "$REPO_ROOT" archive --format=tar "$MAIN_SHA" | tar -x -C "$SRC_DIR" \
    || die "could not export '$DEPLOY_BRANCH'"
  [ -f "$SRC_DIR/package.json" ] || die "the export has no package.json: not the expected repository"
  ok "exported to $SRC_DIR"
}

# Installs the root dependencies exactly as package-lock.json says. Nothing is
# borrowed from the working folder, so the tests and the build use what is committed.
install_root_dependencies() {
  step "Installing dependencies in the clean copy (npm ci)"
  ( cd "$SRC_DIR" && PUPPETEER_SKIP_DOWNLOAD=true npm ci --no-audit --no-fund --loglevel=error ) \
    || die "npm ci failed in the clean copy (is package-lock.json in step with package.json?)"
  ok "dependencies installed"
}

# Runs the code check (lint) of the clean copy. An error stops the deploy; a warning does not.
run_lint() {
  step "Checking the code (npx eslint . --quiet)"
  local log="$WORK_DIR/eslint.log"
  if ( cd "$SRC_DIR" && npx eslint . --quiet ) >"$log" 2>&1; then
    ok "no lint errors"
  else
    tail -40 "$log" >&2
    die "the code check (lint) found errors: nothing was deployed"
  fi
}

# Runs the unit tests of the clean copy. One failure stops the deploy.
run_unit_tests() {
  step "Running the unit tests (npx vitest run)"
  local log="$WORK_DIR/vitest.log"
  if ( cd "$SRC_DIR" && npx vitest run ) >"$log" 2>&1; then
    grep -E '^ *(Test Files|Tests|Duration) ' "$log" | sed 's/^ */    /' || true
    ok "all tests passed"
  else
    tail -60 "$log" >&2
    die "the unit tests failed: nothing was deployed"
  fi
}

# fetch_status URL -- prints the HTTP status of a GET (000 when there is no answer).
fetch_status() {
  curl -s -o /dev/null -w '%{http_code}' --max-time 30 "$1" 2>/dev/null || true
}

print_dry_run_end() {
  printf '\nDRY RUN finished: every step before the deploy passed. Nothing was sent; production was not touched.\n'
}
