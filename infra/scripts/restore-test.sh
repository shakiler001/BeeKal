#!/usr/bin/env bash
#
# Monthly restore test.
#
# An untested backup is a belief, not a capability (docs/05 section 5.3). This
# restores the most recent dump into a THROWAWAY database, checks that the data
# is actually there, and reports what it found.
#
#   0 3 1 * *  /opt/beekal/infra/scripts/restore-test.sh >> /var/log/beekal-restore.log 2>&1
#
# It never touches the live database. The scratch database is dropped at the
# end whether the test passed or failed.

set -euo pipefail

BACKUP_DIR="${BACKUP_DIR:-/var/backups/beekal}"
POSTGRES_CONTAINER="${POSTGRES_CONTAINER:-beekal-postgres-1}"
POSTGRES_USER="${POSTGRES_USER:-beekal}"
SCRATCH_DB="beekal_restore_test"

log() { printf '[%s] %s\n' "$(date -u +%H:%M:%S)" "$*"; }

cleanup() {
	log "Dropping ${SCRATCH_DB}"
	docker exec "${POSTGRES_CONTAINER}" \
		psql --username="${POSTGRES_USER}" --dbname=postgres \
		-c "DROP DATABASE IF EXISTS ${SCRATCH_DB};" >/dev/null 2>&1 || true
}
trap cleanup EXIT

latest="$(find "${BACKUP_DIR}" -name 'beekal-*.sql.gz' -type f -print0 2>/dev/null \
	| xargs -0 ls -t 2>/dev/null | head -n1 || true)"

if [[ -z "${latest}" ]]; then
	log "FATAL: no backup found in ${BACKUP_DIR}"
	exit 1
fi

age_hours=$(( ( $(date +%s) - $(stat -c %Y "${latest}") ) / 3600 ))
log "Testing ${latest} (${age_hours}h old)"

if (( age_hours > 48 )); then
	log "FATAL: the most recent backup is ${age_hours}h old. The nightly job is not running."
	exit 1
fi

log "Creating ${SCRATCH_DB}"
docker exec "${POSTGRES_CONTAINER}" \
	psql --username="${POSTGRES_USER}" --dbname=postgres \
	-c "DROP DATABASE IF EXISTS ${SCRATCH_DB};" >/dev/null
docker exec "${POSTGRES_CONTAINER}" \
	psql --username="${POSTGRES_USER}" --dbname=postgres \
	-c "CREATE DATABASE ${SCRATCH_DB};" >/dev/null

log "Restoring"
gunzip -c "${latest}" | docker exec -i "${POSTGRES_CONTAINER}" \
	psql --username="${POSTGRES_USER}" --dbname="${SCRATCH_DB}" \
	--quiet --set ON_ERROR_STOP=on >/dev/null

# Restoring without error is not the same as restoring something useful. These
# are the tables whose loss would actually hurt.
log "Verifying"
failed=0
for check in "users:1" "roles:8" "permissions:50" "solutions:5" "case_studies:5"; do
	table="${check%%:*}"
	minimum="${check##*:}"

	count="$(docker exec "${POSTGRES_CONTAINER}" \
		psql --username="${POSTGRES_USER}" --dbname="${SCRATCH_DB}" \
		-tAc "SELECT count(*) FROM ${table};" 2>/dev/null || echo 0)"

	if (( count >= minimum )); then
		log "  ok      ${table}: ${count} rows"
	else
		log "  FAILED  ${table}: ${count} rows, expected at least ${minimum}"
		failed=1
	fi
done

if (( failed == 1 )); then
	log "RESTORE TEST FAILED — the backup restores but the data is not all there"
	exit 1
fi

log "RESTORE TEST PASSED"
