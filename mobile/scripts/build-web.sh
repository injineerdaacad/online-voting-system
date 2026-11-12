#!/usr/bin/env bash
# Build the student app for the web (deployed to https://vote.kalsooni.com).
#
#   scripts/build-web.sh [output-dir]      default: dist-web
#
# Then deploy:  cd dist-web && vercel deploy --prod
set -euo pipefail
cd "$(dirname "$0")/.."

OUT="${1:-dist-web}"
API_URL="${EXPO_PUBLIC_API_URL:-https://ovs-api.kalsooni.com}"

# Keep an existing Vercel link across rebuilds
LINK=""
if [[ -d "$OUT/.vercel" ]]; then LINK="$(mktemp -d)"; mv "$OUT/.vercel" "$LINK/"; fi
rm -rf "$OUT"

CI=1 EXPO_PUBLIC_API_URL="$API_URL" npx expo export --platform web --clear --output-dir "$OUT"

# Vercel never uploads folders named node_modules, so the icon fonts that
# Expo puts under assets/node_modules/ would 404. Move them and rewrite.
if [[ -d "$OUT/assets/node_modules" ]]; then
  mv "$OUT/assets/node_modules" "$OUT/assets/nm"
fi
cat > "$OUT/vercel.json" <<'JSON'
{
  "cleanUrls": true,
  "rewrites": [
    { "source": "/assets/node_modules/:path*", "destination": "/assets/nm/:path*" }
  ]
}
JSON

if [[ -n "$LINK" ]]; then mv "$LINK/.vercel" "$OUT/"; rmdir "$LINK"; fi
echo "Built $OUT (API: $API_URL)"
