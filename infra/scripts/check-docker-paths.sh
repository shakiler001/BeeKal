#!/usr/bin/env bash
#
# Every path a Dockerfile copies must exist in a FRESH GIT CHECKOUT.
#
# This exists because of a real failure. apps/web/public was created locally but
# stayed empty; git does not track empty directories; so the web image built on
# every developer machine and failed on every CI runner. The Dockerfile was
# correct — the repository was missing a directory that only appeared to exist.
#
# Two kinds of COPY are checked:
#
#   COPY <path> ...                 the path comes straight from the context
#   COPY --from=<stage> /app/<path> the path came from an earlier stage, which
#                                   itself got it from the context via COPY . .
#
# The second kind is what actually broke, so it is the one that matters most.
#
# Run from the repository root. Exits non-zero if anything would be missing.

set -euo pipefail

fail=0
log() { printf '%s\n' "$*"; }

# Build-stage outputs. These are produced during the build, not committed, so
# a reference to one is fine even though git has never heard of it.
is_build_output() {
	case "$1" in
	dist* | .next* | node_modules* | out* | build*) return 0 ;;
	*/dist* | */.next* | */node_modules* | */out* | */build*) return 0 ;;
	*) return 1 ;;
	esac
}

check_path() {
	local path="$1" origin="$2"

	[[ "${path}" == "." ]] && return 0
	if is_build_output "${path}"; then
		log "  built     ${path}"
		return 0
	fi

	if [[ ! -e "${path}" ]]; then
		log "  MISSING   ${path}  (${origin})"
		fail=1
		return 0
	fi

	# Present on disk is not enough. A fresh checkout only has what git has.
	if [[ -z "$(git ls-files "${path}")" ]]; then
		log "  UNTRACKED ${path}  (${origin})"
		log "            Exists locally, but git has nothing in it — a fresh"
		log "            checkout will not have it and the build will fail."
		log "            Add a .gitkeep if the directory must exist empty."
		fail=1
	else
		log "  ok        ${path}"
	fi
}

for dockerfile in infra/docker/*.Dockerfile; do
	log "Checking ${dockerfile}"

	# --- COPY straight from the build context ---
	while IFS= read -r path; do
		check_path "${path}" "context"
	done < <(
		grep -E '^COPY ' "${dockerfile}" \
			| grep -v -- '--from=' \
			| sed -E 's/^COPY( --chown=[^ ]+)?//' \
			| awk '{ for (i = 1; i < NF; i++) print $i }' \
			| grep -v '^--' \
			| sort -u
	)

	# --- COPY --from=<stage> /app/<path> ---
	# Anything under /app that is not a build output traces back to the
	# context, because the build stage does COPY . .
	while IFS= read -r path; do
		check_path "${path}" "via build stage"
	done < <(
		grep -E '^COPY --from=' "${dockerfile}" \
			| awk '{ for (i = 1; i < NF; i++) if ($i ~ /^\/app\//) print $i }' \
			| sed -E 's#^/app/##' \
			| sort -u
	)
done

if ((fail == 1)); then
	log ""
	log "One or more Dockerfile paths would be missing in a fresh checkout."
	log "This is the failure mode that builds fine locally and breaks in CI."
	exit 1
fi

log ""
log "All Dockerfile paths are present and tracked."
