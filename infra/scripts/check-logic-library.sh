#!/usr/bin/env bash
#
# Verifies that the Logic Library still describes the code.
#
# Documentation that drifts is worse than none: it is confidently wrong. This
# checks the two things that rot fastest —
#
#   1. Every file path the enforcement index cites exists.
#   2. Every internal cross-reference points at a heading that is really there.
#
# It does not check whether the prose is true. Nothing can. It checks that the
# scaffolding has not silently broken.
#
# Run from the repository root.

set -euo pipefail

LIB="LogicLibrary"
fail=0

log() { printf '%s\n' "$*"; }

# --- 1. Cited paths exist ------------------------------------------------

log "Checking cited file paths"

# The first backticked cell of a table row, when it looks like a path.
paths=$(grep -ho '^| `[^`]*`' "${LIB}"/*.md \
	| sed -E 's/^\| `//; s/`$//' \
	| grep -E '^(apps|packages|infra)/' \
	| sort -u)

while IFS= read -r path; do
	[[ -z "${path}" ]] && continue
	# Strip a trailing glob so apps/web/src/app/api/** resolves.
	probe="${path%/\*\*}"
	if [[ -e "${probe}" ]]; then
		log "  ok      ${path}"
	else
		log "  MISSING ${path}"
		fail=1
	fi
done <<<"${paths}"

# --- 2. Cross-references resolve ----------------------------------------

log ""
log "Checking cross-references"

# Collect every heading anchor the library defines, GitHub-style.
anchors_file="$(mktemp)"
trap 'rm -f "${anchors_file}"' EXIT

for file in "${LIB}"/*.md; do
	base="$(basename "${file}")"
	grep -h '^#\{1,4\} ' "${file}" \
		| sed -E 's/^#+ //' \
		| tr '[:upper:]' '[:lower:]' \
		| sed -E 's/[^a-z0-9 -]//g; s/ /-/g' \
		| while IFS= read -r anchor; do
			printf '%s#%s\n' "${base}" "${anchor}" >>"${anchors_file}"
		done
done

broken=0
while IFS= read -r ref; do
	[[ -z "${ref}" ]] && continue
	if ! grep -Fxq "${ref}" "${anchors_file}"; then
		log "  BROKEN  ${ref}"
		broken=$((broken + 1))
		fail=1
	fi
done <<<"$(grep -ho '](0[0-9]-[a-z-]*\.md#[a-z0-9-]*)' "${LIB}"/*.md \
	| sed -E 's/^\]\(//; s/\)$//' \
	| sort -u)"

if ((broken == 0)); then
	log "  ok      all cross-references resolve"
fi

# --- Result --------------------------------------------------------------

log ""
if ((fail == 1)); then
	log "The Logic Library no longer matches the codebase."
	log "Fix the reference, or fix the document, in the same change."
	exit 1
fi

log "Logic Library is consistent with the codebase."
