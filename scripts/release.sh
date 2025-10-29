#!/usr/bin/env bash

set -euo pipefail

usage() {
  echo "Usage: $(basename "$0") [-m|--message \"commit message\"] <patch|minor|major>" >&2
  exit 1
}

COMMIT_MESSAGE="chore: prepare release"
BUMP_TYPE=""

# Parse args (allow -m before or after bump type)
while [ $# -gt 0 ]; do
  case "$1" in
    -m|--message)
      shift
      [ $# -gt 0 ] || usage
      COMMIT_MESSAGE="$1"
      ;;
    patch|minor|major)
      BUMP_TYPE="$1"
      ;;
    *)
      usage
      ;;
  esac
  shift
done

[ -n "$BUMP_TYPE" ] || usage

# Ensure we are on a git repo and have a branch
git rev-parse --is-inside-work-tree >/dev/null 2>&1 || { echo "Not a git repository" >&2; exit 1; }

# Sync with remote tags (no network failures allowed to pass silently)
git fetch --tags --prune

# Commit any pending changes so they are included in the release
if ! git diff --quiet || ! git diff --cached --quiet; then
  git add -A
  git commit -m "$COMMIT_MESSAGE"
fi

# Bump version, create git commit and tag via npm (respects prepublishOnly for build on publish)
npm version "$BUMP_TYPE" -m "chore(release): %s"

# Push branch and tags
CURRENT_BRANCH="$(git rev-parse --abbrev-ref HEAD)"
git push origin "$CURRENT_BRANCH" --follow-tags

# Publish to npm (scoped package -> ensure public access)
npm publish

echo "Release complete."


