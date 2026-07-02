#!/usr/bin/env bash
# Создаёт git-тег релиза после проверок: CHANGELOG, package.json, чистое дерево, отсутствие тега.
# Использование: npm run release -- <версия> [--skip-ci] [--dry-run]
# Пример: npm run release -- 1.2.0

set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

CHANGELOG="CHANGELOG.md"
SKIP_CI=false
DRY_RUN=false
VERSION=""

usage() {
	echo "Usage: $0 <version> [--skip-ci] [--dry-run]" >&2
	echo "  version   Semver MAJOR.MINOR.PATCH (допустим префикс v, напр. v1.2.0)" >&2
	echo "  --skip-ci Не запускать npm run check и npm run knip перед тегом" >&2
	echo "  --dry-run Только проверки, без git tag и git push (дерево может быть с незакоммиченными правками)" >&2
	exit "${1:-1}"
}

while [[ $# -gt 0 ]]; do
	case "$1" in
		--skip-ci)
			SKIP_CI=true
			shift
			;;
		--dry-run)
			DRY_RUN=true
			shift
			;;
		-h | --help)
			usage 0
			;;
		*)
			if [[ -n "$VERSION" ]]; then
				echo "ERROR: лишний аргумент: $1" >&2
				usage
			fi
			VERSION="${1#v}"
			shift
			;;
	esac
done

if [[ -z "$VERSION" ]]; then
	echo "ERROR: укажите версию." >&2
	usage
fi

if [[ ! "$VERSION" =~ ^[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
	echo "ERROR: версия должна быть semver вида MAJOR.MINOR.PATCH (например 1.2.0)." >&2
	exit 1
fi

TAG="v${VERSION}"

if [[ ! -f "$CHANGELOG" ]]; then
	echo "ERROR: не найден ${CHANGELOG}" >&2
	exit 1
fi

SECTION_FILE=$(mktemp)
trap 'rm -f "$SECTION_FILE"' EXIT

awk -v ver="$VERSION" '
	BEGIN { hdr = "## [" ver "]" }
	substr($0, 1, length(hdr)) == hdr { flag = 1; next }
	/^## / && flag { exit }
	flag { print }
' "$CHANGELOG" >"$SECTION_FILE"

if [[ ! -s "$SECTION_FILE" ]]; then
	echo "ERROR: в ${CHANGELOG} нет секции ## [${VERSION}]. Добавьте описание релиза." >&2
	exit 1
fi

# Минимальная «осмысленность» текста: без пробелов не меньше порога (не только заголовки ###).
STRIPPED=$(tr -d '[:space:]' <"$SECTION_FILE" | tr -d '#')
if [[ ${#STRIPPED} -lt 40 ]]; then
	echo "ERROR: секция ## [${VERSION}] слишком короткая или пустая — допишите описание для релиза." >&2
	exit 1
fi

PKG_VER=$(node -p "require('./package.json').version")
if [[ "$PKG_VER" != "$VERSION" ]]; then
	echo "ERROR: в package.json version=\"${PKG_VER}\", ожидается \"${VERSION}\". Обновите package.json под релиз." >&2
	exit 1
fi

if ! git rev-parse --git-dir >/dev/null 2>&1; then
	echo "ERROR: не git-репозиторий." >&2
	exit 1
fi

if [[ "$DRY_RUN" != true ]]; then
	if ! git diff --quiet || ! git diff --cached --quiet; then
		echo "ERROR: есть незакоммиченные изменения. Закоммитьте CHANGELOG и package.json перед релизом." >&2
		exit 1
	fi

	if git rev-parse "$TAG" >/dev/null 2>&1; then
		echo "ERROR: локальный тег ${TAG} уже существует." >&2
		exit 1
	fi

	REMOTE_TAGS=$(git ls-remote origin "refs/tags/${TAG}" 2>/dev/null || true)
	if [[ -n "$REMOTE_TAGS" ]]; then
		echo "ERROR: тег ${TAG} уже есть на origin." >&2
		exit 1
	fi
fi

if [[ "$SKIP_CI" != true ]]; then
	echo "→ npm run check"
	npm run check
	echo "→ npm run knip"
	npm run knip
fi

if [[ "$DRY_RUN" == true ]]; then
	echo "→ dry-run: проверки прошли, тег и push не выполнялись."
	exit 0
fi

echo "→ git tag ${TAG}"
git tag "$TAG"

echo "→ git push origin ${TAG}"
git push origin "$TAG"

echo "Готово. GitHub Actions создаст Release и задеплоит Pages."
