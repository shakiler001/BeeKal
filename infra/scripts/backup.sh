#!/usr/bin/env bash
#
# Nightly backup.
#
# Writes a compressed, encrypted dump and prunes old ones. Designed to be run
# from cron on the host:
#
#   0 2 * * *  /opt/beekal/infra/scripts/backup.sh >> /var/log/beekal-backup.log 2>&1
#
# A backup stored on the machine it protects is not a backup, so BACKUP_REMOTE
# is not optional in production — the script warns loudly when it is unset
# rather than pretending the job succeeded.

set -euo pipefail

BACKUP_DIR="${BACKUP_DIR:-/var/backups/beekal}"
KEEP_DAILY="${KEEP_DAILY:-30}"
KEEP_WEEKLY="${KEEP_WEEKLY:-52}"
POSTGRES_CONTAINER="${POSTGRES_CONTAINER:-beekal-postgres-1}"
POSTGRES_USER="${POSTGRES_USER:-beekal}"
POSTGRES_DB="${POSTGRES_DB:-beekal}"
# Age or GPG recipient. Unset means the dump is written in the clear.
BACKUP_RECIPIENT="${BACKUP_RECIPIENT:-}"
# rclone remote, e.g. "b2:beekal-backups". Empty means local only.
BACKUP_REMOTE="${BACKUP_REMOTE:-}"

timestamp="$(date -u +%Y%m%dT%H%M%SZ)"
weekday="$(date -u +%u)"
outfile="${BACKUP_DIR}/beekal-${timestamp}.sql.gz"

mkdir -p "${BACKUP_DIR}"

log() { printf '[%s] %s\n' "$(date -u +%H:%M:%S)" "$*"; }

log "Dumping ${POSTGRES_DB} from ${POSTGRES_CONTAINER}"

# --clean --if-exists so the dump can be restored over an existing database
# without a manual drop first, which is what you want at 3am.
docker exec "${POSTGRES_CONTAINER}" \
	pg_dump --username="${POSTGRES_USER}" --dbname="${POSTGRES_DB}" \
	--clean --if-exists --no-owner --no-privileges \
	| gzip -9 > "${outfile}"

size="$(du -h "${outfile}" | cut -f1)"
log "Wrote ${outfile} (${size})"

# A dump that gunzip cannot read is not a backup. Check before pruning.
if ! gzip -t "${outfile}"; then
	log "FATAL: ${outfile} is corrupt — keeping previous backups and exiting non-zero"
	rm -f "${outfile}"
	exit 1
fi
log "Integrity check passed"

if [[ -n "${BACKUP_RECIPIENT}" ]]; then
	log "Encrypting for ${BACKUP_RECIPIENT}"
	age --recipient "${BACKUP_RECIPIENT}" --output "${outfile}.age" "${outfile}"
	rm -f "${outfile}"
	outfile="${outfile}.age"
else
	log "WARNING: BACKUP_RECIPIENT is unset — this dump is NOT encrypted"
fi

if [[ -n "${BACKUP_REMOTE}" ]]; then
	log "Copying to ${BACKUP_REMOTE}"
	rclone copy "${outfile}" "${BACKUP_REMOTE}/daily/"
	if [[ "${weekday}" == "7" ]]; then
		rclone copy "${outfile}" "${BACKUP_REMOTE}/weekly/"
	fi
	log "Off-site copy complete"
else
	log "WARNING: BACKUP_REMOTE is unset — this backup lives only on the machine it protects"
fi

log "Pruning local backups older than ${KEEP_DAILY} days"
find "${BACKUP_DIR}" -name 'beekal-*.sql.gz*' -type f -mtime "+${KEEP_DAILY}" -delete

if [[ -n "${BACKUP_REMOTE}" ]]; then
	rclone delete --min-age "${KEEP_DAILY}d" "${BACKUP_REMOTE}/daily/"
	rclone delete --min-age "${KEEP_WEEKLY}w" "${BACKUP_REMOTE}/weekly/"
fi

log "Done"
