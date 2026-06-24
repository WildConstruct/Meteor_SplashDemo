#!/usr/bin/env bash
# Publish the built site to the gh-pages branch WITHOUT GitHub Actions.
#
# Use this when Actions runners are unavailable (the Actions-based deploy in
# .github/workflows/deploy-pages.yml needs runners). Builds with the project
# subpath base and pushes dist/ to gh-pages via a temporary index — it never
# touches your working tree or current branch.
#
# After the first run, enable Pages once: repo Settings -> Pages ->
# "Deploy from a branch" -> branch: gh-pages, folder: / (root).
# Live at: https://<owner>.github.io/<repo>/

set -euo pipefail
cd "$(dirname "$0")/.."

# On Windows git-bash/MSYS, env values that look like POSIX paths (e.g.
# BASE_PATH=/Meteor_SplashDemo/) get rewritten to Windows paths before reaching
# node, which corrupts Vite's base (assets 404 on Pages). Exclude env + arg path
# conversion. Harmless on Linux/macOS (just unused env vars).
export MSYS_NO_PATHCONV=1
export MSYS2_ENV_CONV_EXCL='*'

REPO_NAME="${REPO_NAME:-Meteor_SplashDemo}"
echo "Building with base=/$REPO_NAME/ ..."
rm -rf dist
BASE_PATH="/$REPO_NAME/" npx vite build
# Guard: fail loudly if the base got mangled rather than deploying broken assets.
if ! grep -q "\"/$REPO_NAME/assets/\|/$REPO_NAME/assets/" dist/index.html; then
  echo "ERROR: dist/index.html base path is not /$REPO_NAME/ — aborting deploy." >&2
  grep -o '/[^"'\'' ]*assets/[^"'\'' ]*' dist/index.html | head -1 >&2 || true
  exit 1
fi
npm run assets >/dev/null 2>&1 || true
touch dist/.nojekyll

IDX="$(mktemp -u)"
GIT_INDEX_FILE="$IDX" git --git-dir="$PWD/.git" -C dist add -A .
TREE="$(GIT_INDEX_FILE="$IDX" git --git-dir="$PWD/.git" write-tree)"
COMMIT="$(git commit-tree "$TREE" -m "Deploy site ($(date -u +%Y-%m-%dT%H:%M:%SZ))")"
rm -f "$IDX"

echo "Pushing $COMMIT -> gh-pages ..."
git push -f origin "$COMMIT:refs/heads/gh-pages"
echo "Done. Enable Pages (Deploy from branch -> gh-pages /) if not already."
