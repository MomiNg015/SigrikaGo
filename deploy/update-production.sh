#!/usr/bin/env bash
set -Eeuo pipefail

umask 077

SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="${SIGRIKAGO_PROJECT_DIR:-$(cd -- "${SCRIPT_DIR}/.." && pwd)}"
SERVICE_NAME="${SIGRIKAGO_SERVICE_NAME:-sigrikago}"
DATABASE_PATH="${SIGRIKAGO_DATABASE_PATH:-/var/lib/sigrikago/prod.db}"
BACKUP_DIR="${SIGRIKAGO_BACKUP_DIR:-/var/backups/sigrikago}"
NGINX_SITE_PATH="${SIGRIKAGO_NGINX_SITE_PATH:-/etc/nginx/sites-available/sigrikago}"
NGINX_SITE_LINK="${SIGRIKAGO_NGINX_SITE_LINK:-/etc/nginx/sites-enabled/sigrikago}"
NGINX_ROUTES_PATH="${SIGRIKAGO_NGINX_ROUTES_PATH:-/etc/nginx/snippets/sigrikago-routes.conf}"
HEALTH_URL="${SIGRIKAGO_HEALTH_URL:-http://127.0.0.1:3001/health/ready}"
EXPECTED_BRANCH="master"
DEPLOY_STARTED_AT="$(date +%F-%H%M%S)"
BUILD_ROOT="${PROJECT_DIR}/.releases/production-update-${DEPLOY_STARTED_AT}"
NEW_RELEASE="${BUILD_ROOT}/release"
PREVIOUS_RELEASE="${BUILD_ROOT}/previous-release"
RELEASE_DROPIN="/etc/systemd/system/${SERVICE_NAME}.service.d/90-release.conf"
DATABASE_TOUCHED=0
RELEASE_SWITCHED=0
NGINX_CHANGED=0
STAGED_DIST="${NEW_RELEASE}/dist"
PREVIOUS_DIST="${BUILD_ROOT}/previous-dist"
NEXT_DIST="${BUILD_ROOT}/next-dist"
SERVICE_STOPPED=0
DIST_SWAPPED=0

log() {
  printf '[sigrikago-update] %s\n' "$*"
}

fail() {
  printf '[sigrikago-update] ERROR: %s\n' "$*" >&2
  exit 1
}

require_command() {
  command -v "$1" >/dev/null 2>&1 || fail "Missing required command: $1"
}

restore_nginx_file() {
  local backup_path="$1"
  local target_path="$2"
  if [[ -n "${backup_path}" && -f "${backup_path}" ]]; then
    cp -a -- "${backup_path}" "${target_path}"
  else
    rm -f -- "${target_path}"
  fi
}

write_release_dropin() {
  mkdir -p -- "$(dirname -- "${RELEASE_DROPIN}")"
  printf '[Service]\nWorkingDirectory="%s"\nEnvironmentFile="%s/.env"\nExecStart=\nExecStart=/usr/bin/node "%s/server/index.js"\n' \
    "$1" "${PROJECT_DIR}" "$1" > "${RELEASE_DROPIN}"
  systemctl daemon-reload
}

on_exit() {
  local status=$?
  (( status != 0 )) || return 0
  if (( SERVICE_STOPPED == 1 && DATABASE_TOUCHED == 1 )); then
    systemctl stop "${SERVICE_NAME}" || true
  fi
  if (( DIST_SWAPPED == 1 )) && [[ -d "${PREVIOUS_DIST}" ]]; then
    mv -- "${PROJECT_DIR}/dist" "${BUILD_ROOT}/failed-dist" || true
    mv -- "${PREVIOUS_DIST}" "${PROJECT_DIR}/dist" || true
  fi
  if (( RELEASE_SWITCHED == 1 )); then
    write_release_dropin "${PREVIOUS_RELEASE}" || true
  fi
  if (( NGINX_CHANGED == 1 )); then
    restore_nginx_file "${NGINX_SITE_BACKUP}" "${NGINX_SITE_PATH}"
    restore_nginx_file "${NGINX_ROUTES_BACKUP}" "${NGINX_ROUTES_PATH}"
    nginx -t && systemctl reload nginx || true
  fi
  if (( SERVICE_STOPPED == 1 && DATABASE_TOUCHED == 0 )); then
    systemctl start "${SERVICE_NAME}" || true
  elif (( DATABASE_TOUCHED == 1 )); then
    log "Database migration began; service remains stopped. Do not restart until recovery is reviewed."
    printf 'Recovery: sudo %q %q %q %q\n' "${NEW_RELEASE}/deploy/restore-production.sh" \
      "${PROJECT_DIR}" "${PREVIOUS_RELEASE}" "${STOPPED_DATABASE_BACKUP}" >&2
  fi
  printf '[sigrikago-update] FAILED (%s). Releases: %s; backups: %s\n' "${status}" "${BUILD_ROOT}" "${BACKUP_DIR}" >&2
}
trap on_exit EXIT

[[ "${EUID}" -eq 0 ]] || fail "Run this script as root: sudo ./deploy/update-production.sh"

for command_name in git node npm npx nginx systemctl curl install seq tar cp; do
  require_command "${command_name}"
done

cd -- "${PROJECT_DIR}"
[[ -d .git ]] || fail "Not a Git checkout: ${PROJECT_DIR}"
[[ -f .env ]] || fail "Missing production environment file: ${PROJECT_DIR}/.env"
set -a
# shellcheck disable=SC1091
. "${PROJECT_DIR}/.env"
set +a
[[ "${NODE_ENV:-}" == production ]] || fail "NODE_ENV must be production"
[[ "${DATABASE_URL:-}" == "file:${DATABASE_PATH}" ]] || fail "DATABASE_URL must point to the declared absolute production database"
[[ "${SERVICE_NAME}" =~ ^[a-zA-Z0-9_-]+$ ]] || fail "Invalid service name"
[[ "${PROJECT_DIR}" != *\"* && "${PROJECT_DIR}" != *$'\n'* ]] || fail "Invalid project path"
PRACTICE_ENGINE_PATH="${PRACTICE_ENGINE_PATH:-/usr/games/gnugo}"
[[ "${DATABASE_PATH}" == /* ]] || fail "Database path must be absolute: ${DATABASE_PATH}"
[[ "${BACKUP_DIR}" == /* ]] || fail "Backup directory must be absolute: ${BACKUP_DIR}"
[[ "${PRACTICE_ENGINE_PATH}" == /* ]] || fail "Practice engine path must be absolute: ${PRACTICE_ENGINE_PATH}"
[[ -x "${PRACTICE_ENGINE_PATH}" ]] || fail "GNU Go is missing or not executable: ${PRACTICE_ENGINE_PATH}"
"${PRACTICE_ENGINE_PATH}" --version >/dev/null \
  || fail "GNU Go failed its version probe: ${PRACTICE_ENGINE_PATH}"
[[ "${NGINX_SITE_PATH}" == /etc/nginx/* ]] || fail "Nginx site path must stay below /etc/nginx"
[[ "${NGINX_SITE_LINK}" == /etc/nginx/* ]] || fail "Nginx site link must stay below /etc/nginx"
[[ "${NGINX_ROUTES_PATH}" == /etc/nginx/* ]] || fail "Nginx routes path must stay below /etc/nginx"
[[ -f "${DATABASE_PATH}" ]] || fail "Production database not found: ${DATABASE_PATH}"
[[ -d "${PROJECT_DIR}/dist" ]] || fail "Current production bundle is missing: ${PROJECT_DIR}/dist"
[[ -f /etc/letsencrypt/live/sigrikago.com/fullchain.pem ]] || fail "Missing TLS certificate for sigrikago.com"
[[ -f /etc/letsencrypt/live/sigrikago.com/privkey.pem ]] || fail "Missing TLS private key for sigrikago.com"
[[ "$(git branch --show-current)" == "${EXPECTED_BRANCH}" ]] || fail "Switch to ${EXPECTED_BRANCH} before updating"
git diff --quiet || fail "Tracked working-tree changes exist; commit or restore them first"
git diff --cached --quiet || fail "Staged changes exist; commit or restore them first"
systemctl is-active --quiet "${SERVICE_NAME}" || fail "${SERVICE_NAME} is not currently active"

log "Fetching origin/${EXPECTED_BRANCH}."
git fetch origin "${EXPECTED_BRANCH}"
git merge-base --is-ancestor HEAD "origin/${EXPECTED_BRANCH}" \
  || fail "Local ${EXPECTED_BRANCH} contains commits or divergence not present on origin/${EXPECTED_BRANCH}"

mkdir -p -- "${BACKUP_DIR}"
chmod 700 -- "${BACKUP_DIR}"
DATABASE_BACKUP="${BACKUP_DIR}/pre-update-${DEPLOY_STARTED_AT}.db"
log "Creating verified SQLite backup: ${DATABASE_BACKUP}"
npm run backup:sqlite -- --source "${DATABASE_PATH}" --output "${DATABASE_BACKUP}"

# Keep the backup private, then restore normal read/execute permissions so Nginx
# can traverse and serve the staged production bundle after activation.
umask 022

RELEASE_COMMIT="$(git rev-parse "origin/${EXPECTED_BRANCH}")"
[[ "${BUILD_ROOT}" == "${PROJECT_DIR}/.releases/production-update-"* ]] || fail "Unsafe release staging path"
[[ ! -e "${BUILD_ROOT}" ]] || fail "Release staging path already exists"
mkdir -p -- "${NEW_RELEASE}" "${PREVIOUS_RELEASE}"
ACTIVE_RELEASE="$(systemctl show "${SERVICE_NAME}" --property=WorkingDirectory --value)"
[[ "${ACTIVE_RELEASE}" == "${PROJECT_DIR}" || "${ACTIVE_RELEASE}" == "${PROJECT_DIR}/.releases/"* ]] || fail "Unexpected active release directory"
[[ -f "${ACTIVE_RELEASE}/server/index.js" && -d "${ACTIVE_RELEASE}/node_modules" ]] || fail "Active release is incomplete"
log "Saving the complete running release, including locked dependencies and frontend."
tar -C "${ACTIVE_RELEASE}" --exclude=.git --exclude=.releases --exclude=.tmp --exclude=.env \
  --exclude=uploads --exclude='*.db*' -cf - . | tar -C "${PREVIOUS_RELEASE}" -xf -
git archive "${RELEASE_COMMIT}" | tar -C "${NEW_RELEASE}" -xf -
printf '%s\n' "${RELEASE_COMMIT}" > "${NEW_RELEASE}/release-commit.txt"
cd -- "${NEW_RELEASE}"
log "Installing locked dependencies and building the isolated release."
npm ci --include=dev
npm run build -- --outDir "${STAGED_DIST}"
npm run check:built-css -- --dist "${STAGED_DIST}"
npm run check:production
cp -a -- "${STAGED_DIST}" "${NEXT_DIST}"

mkdir -p -- "$(dirname -- "${NGINX_ROUTES_PATH}")" "$(dirname -- "${NGINX_SITE_PATH}")" "$(dirname -- "${NGINX_SITE_LINK}")"
NGINX_SITE_BACKUP=""
NGINX_ROUTES_BACKUP=""
if [[ -f "${NGINX_SITE_PATH}" ]]; then
  NGINX_SITE_BACKUP="${BACKUP_DIR}/nginx-site-${DEPLOY_STARTED_AT}.conf"
  cp -a -- "${NGINX_SITE_PATH}" "${NGINX_SITE_BACKUP}"
fi
if [[ -f "${NGINX_ROUTES_PATH}" ]]; then
  NGINX_ROUTES_BACKUP="${BACKUP_DIR}/nginx-routes-${DEPLOY_STARTED_AT}.conf"
  cp -a -- "${NGINX_ROUTES_PATH}" "${NGINX_ROUTES_BACKUP}"
fi

NGINX_CHANGED=1
install -m 0644 -- deploy/nginx/sigrikago.conf "${NGINX_SITE_PATH}"
install -m 0644 -- deploy/nginx/sigrikago-routes.conf "${NGINX_ROUTES_PATH}"
ln -sfn -- "${NGINX_SITE_PATH}" "${NGINX_SITE_LINK}"
if ! nginx -t; then
  log "New Nginx configuration is invalid; restoring the previous files."
  restore_nginx_file "${NGINX_SITE_BACKUP}" "${NGINX_SITE_PATH}"
  restore_nginx_file "${NGINX_ROUTES_BACKUP}" "${NGINX_ROUTES_PATH}"
  nginx -t || true
  fail "Nginx validation failed; Nginx was not reloaded"
fi

log "Stopping ${SERVICE_NAME} for migrations and admin-default reconciliation."
systemctl stop "${SERVICE_NAME}"
SERVICE_STOPPED=1
STOPPED_DATABASE_BACKUP="${BACKUP_DIR}/pre-migration-${DEPLOY_STARTED_AT}.db"
log "Backing up the drained database immediately before migration."
umask 077
npm run backup:sqlite -- --source "${DATABASE_PATH}" --output "${STOPPED_DATABASE_BACKUP}"
printf 'Previous release: %s\nDrained database backup: %s\nCandidate commit: %s\n' \
  "${PREVIOUS_RELEASE}" "${STOPPED_DATABASE_BACKUP}" "${RELEASE_COMMIT}" > "${BACKUP_DIR}/recovery-${DEPLOY_STARTED_AT}.txt"
umask 022
DATABASE_TOUCHED=1
npx prisma migrate deploy
npm run production:schema-compat
npm run admin:sync-defaults
npm run admin:sync-defaults -- --apply

log "Activating the staged frontend bundle."
mv -- "${PROJECT_DIR}/dist" "${PREVIOUS_DIST}"
if ! mv -- "${NEXT_DIST}" "${PROJECT_DIR}/dist"; then
  mv -- "${PREVIOUS_DIST}" "${PROJECT_DIR}/dist" || true
  fail "Could not activate the staged frontend bundle"
fi
DIST_SWAPPED=1

RELEASE_SWITCHED=1
write_release_dropin "${NEW_RELEASE}"
log "Reloading Nginx and starting ${SERVICE_NAME}."
systemctl reload nginx
systemctl start "${SERVICE_NAME}"

READY=0
for _attempt in $(seq 1 12); do
  if curl --fail --silent --show-error --connect-timeout 2 --max-time 3 "${HEALTH_URL}" >/dev/null; then
    READY=1
    break
  fi
  sleep 2
done
(( READY == 1 )) || fail "Service did not become ready within 60 seconds; inspect: journalctl -u ${SERVICE_NAME} -n 100"

# Move the operator checkout only after the exact candidate becomes healthy.
cd -- "${PROJECT_DIR}"
git merge --ff-only "${RELEASE_COMMIT}"
SERVICE_STOPPED=0
DIST_SWAPPED=0
RELEASE_SWITCHED=0
NGINX_CHANGED=0
trap - EXIT
log "Update complete."
log "Commit: ${RELEASE_COMMIT}"
log "Running release: ${NEW_RELEASE}"
log "Previous complete release: ${PREVIOUS_RELEASE}"
log "Pre-migration database backup: ${STOPPED_DATABASE_BACKUP}"
systemctl --no-pager --full status "${SERVICE_NAME}"
