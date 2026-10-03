#!/usr/bin/env bash
set -Eeuo pipefail
umask 077

fail() { printf '[sigrikago-restore] ERROR: %s\n' "$*" >&2; exit 1; }
[[ "${EUID}" -eq 0 && "$#" -eq 3 ]] || fail "Usage: sudo restore-production.sh PROJECT_DIR PREVIOUS_RELEASE PRE_MIGRATION_DB"
PROJECT_DIR="$(realpath -- "$1")"
PREVIOUS_RELEASE="$(realpath -- "$2")"
DATABASE_BACKUP="$(realpath -- "$3")"
SERVICE_NAME="${SIGRIKAGO_SERVICE_NAME:-sigrikago}"
DATABASE_PATH="${SIGRIKAGO_DATABASE_PATH:-/var/lib/sigrikago/prod.db}"
BACKUP_DIR="${SIGRIKAGO_BACKUP_DIR:-/var/backups/sigrikago}"
HEALTH_URL="${SIGRIKAGO_HEALTH_URL:-http://127.0.0.1:3001/health/ready}"
[[ "${PREVIOUS_RELEASE}" == "${PROJECT_DIR}/.releases/"* ]] || fail "Previous release must belong to this project's .releases directory"
[[ "${SERVICE_NAME}" =~ ^[a-zA-Z0-9_-]+$ ]] || fail "Invalid service name"
[[ "${PROJECT_DIR}" != *\"* && "${PROJECT_DIR}" != *$'\n'* ]] || fail "Invalid project path"
[[ "${DATABASE_PATH}" == /* && "${BACKUP_DIR}" == /* ]] || fail "Database and backup directories must be absolute"
[[ -f "${DATABASE_BACKUP}" && -f "${DATABASE_PATH}" ]] || fail "Database or selected backup is missing"
[[ -f "${PREVIOUS_RELEASE}/server/index.js" && -d "${PREVIOUS_RELEASE}/node_modules" && -d "${PREVIOUS_RELEASE}/dist" ]] || fail "Previous release is incomplete"
set -a
. "${PROJECT_DIR}/.env"
set +a
[[ "${NODE_ENV:-}" == production && "${DATABASE_URL:-}" == "file:${DATABASE_PATH}" ]] || fail "Production environment/database mismatch"
STAMP="$(date +%F-%H%M%S)"
RESTORED_DB="${DATABASE_PATH}.restore-${STAMP}"
[[ ! -e "${RESTORED_DB}" ]] || fail "Restore staging file already exists"
cd -- "${PREVIOUS_RELEASE}"
# Validate the selected backup before downtime or changes to the current database.
npm run backup:sqlite -- --source "${DATABASE_BACKUP}" --output "${RESTORED_DB}"
chown --reference="${DATABASE_PATH}" "${RESTORED_DB}"
chmod --reference="${DATABASE_PATH}" "${RESTORED_DB}"
systemctl stop "${SERVICE_NAME}"
on_restore_failure() {
  local exit_code=$?
  trap - ERR
  systemctl stop "${SERVICE_NAME}" || true
  printf '[sigrikago-restore] Recovery failed; service remains stopped.\n' >&2
  exit "${exit_code}"
}
trap on_restore_failure ERR
mkdir -p -- "${BACKUP_DIR}"
chmod 700 -- "${BACKUP_DIR}"
# Retain even the failed candidate's latest data before choosing the older snapshot.
npm run backup:sqlite -- --source "${DATABASE_PATH}" --output "${BACKUP_DIR}/pre-recovery-${STAMP}.db"
mv -- "${DATABASE_PATH}" "${DATABASE_PATH}.before-recovery-${STAMP}"
rm -f -- "${DATABASE_PATH}-wal" "${DATABASE_PATH}-shm" "${DATABASE_PATH}-journal"
mv -- "${RESTORED_DB}" "${DATABASE_PATH}"
umask 022
NEXT_DIST="${PROJECT_DIR}/.releases/recovery-dist-${STAMP}"
[[ ! -e "${NEXT_DIST}" ]] || fail "Frontend restore staging directory already exists"
cp -a -- "${PREVIOUS_RELEASE}/dist" "${NEXT_DIST}"
if [[ -d "${PROJECT_DIR}/dist" ]]; then mv -- "${PROJECT_DIR}/dist" "${PROJECT_DIR}/.releases/pre-recovery-dist-${STAMP}"; fi
mv -- "${NEXT_DIST}" "${PROJECT_DIR}/dist"
DROPIN="/etc/systemd/system/${SERVICE_NAME}.service.d/90-release.conf"
mkdir -p -- "$(dirname -- "${DROPIN}")"
printf '[Service]\nWorkingDirectory="%s"\nEnvironmentFile="%s/.env"\nExecStart=\nExecStart=/usr/bin/node "%s/server/index.js"\n' \
  "${PREVIOUS_RELEASE}" "${PROJECT_DIR}" "${PREVIOUS_RELEASE}" > "${DROPIN}"
systemctl daemon-reload
nginx -t
systemctl reload nginx
systemctl start "${SERVICE_NAME}"
for _attempt in $(seq 1 12); do
  if curl --fail --silent --show-error --connect-timeout 2 --max-time 3 "${HEALTH_URL}" >/dev/null; then
    trap - ERR
    printf '[sigrikago-restore] Complete. Restored release: %s\n' "${PREVIOUS_RELEASE}"
    exit 0
  fi
  sleep 2
done
systemctl stop "${SERVICE_NAME}"
fail "Restored service did not become ready; it has been stopped"
