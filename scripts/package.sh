#!/usr/bin/env bash
set -euo pipefail

VERSION="$(node -p "require('./package.json').version")"
OUT="cma-api-deployable-v${VERSION}.zip"

echo "Packaging CMA API version ${VERSION} -> ${OUT}";

# Temp staging dir
STAGE="dist-package"
rm -rf "$STAGE"
mkdir -p "$STAGE"

# Copy selected files/directories
INCLUDE=(
  server.js
  package.json
  package-lock.json
  index.html
  README.md
  API-USAGE-GUIDE.md
  COMMUNITIES-API-GUIDE.md
  TEAM-MANAGEMENT-API.md
  DEPLOYMENT-README.md
  API-TEST-RESULTS-FOR-UI-DEVELOPER.md
)

for f in "${INCLUDE[@]}"; do
  if [ -f "$f" ]; then
    cp "$f" "$STAGE/"
  fi
done

# Create minimal Procfile for EB if not present
if [ ! -f Procfile ]; then
  echo "web: node server.js" > "$STAGE/Procfile"
else
  cp Procfile "$STAGE/"
fi

# Copy .env template if exists
[ -f .env.template ] && cp .env.template "$STAGE/.env.template"

# Zip it
rm -f "$OUT"
( cd "$STAGE" && zip -qr "../$OUT" . )

# Show result
ls -lh "$OUT"

echo "Done. Upload $OUT to Elastic Beanstalk or your hosting provider."