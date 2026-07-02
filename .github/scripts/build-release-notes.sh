#!/usr/bin/env bash
set -euo pipefail

# Usage: build-release-notes.sh <tag_name_without_validation>
# Expects: CHANGELOG.md at repo root, git history available (fetch-depth: 0).

TAG_NAME="${1:?tag name required}"
VERSION="${TAG_NAME#v}"

CHANGELOG="CHANGELOG.md"
if [[ ! -f "$CHANGELOG" ]]; then
	echo "ERROR: $CHANGELOG not found" >&2
	exit 1
fi

SECTION_FILE=$(mktemp)
COMMITS_FILE=$(mktemp)
cleanup() {
	rm -f "$SECTION_FILE" "$COMMITS_FILE"
}
trap cleanup EXIT

awk -v ver="$VERSION" '
	BEGIN { hdr = "## [" ver "]" }
	substr($0, 1, length(hdr)) == hdr { flag = 1; next }
	/^## / && flag { exit }
	flag { print }
' "$CHANGELOG" >"$SECTION_FILE"

if [[ ! -s "$SECTION_FILE" ]]; then
	echo "ERROR: No section ## [${VERSION}] in ${CHANGELOG}. Add it before creating tag ${TAG_NAME}." >&2
	exit 1
fi

PREV_TAG=""
if PREV_TAG=$(git describe --tags --abbrev=0 HEAD^ 2>/dev/null); then
	git log "${PREV_TAG}..HEAD" --pretty=format:'- %h %s' --no-merges >"$COMMITS_FILE" || true
else
	git log --pretty=format:'- %h %s' --no-merges >"$COMMITS_FILE" || true
fi

{
	cat "$SECTION_FILE"
	echo ""
	echo "---"
	echo ""
	echo "### Коммиты"
	echo ""
	if [[ -s "$COMMITS_FILE" ]]; then
		cat "$COMMITS_FILE"
	else
		echo "_Нет коммитов в выбранном диапазоне._"
	fi
	echo ""
}
