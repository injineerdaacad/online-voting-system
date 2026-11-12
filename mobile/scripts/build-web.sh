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
# Expo puts under assets/node_modules/ would 404. Move them to assets/nm,
# point the bundle at the new path, and give each changed bundle a new file
# name so browsers and CDNs that cached the old 404 fetch fresh copies.
if [[ -d "$OUT/assets/node_modules" ]]; then
  mv "$OUT/assets/node_modules" "$OUT/assets/nm"
  for js in "$OUT"/_expo/static/js/web/*.js; do
    grep -q '/assets/node_modules/' "$js" || continue
    sed -i 's#/assets/node_modules/#/assets/nm/#g' "$js"
    old="$(basename "$js")"
    new="${old%.js}-$(sha1sum "$js" | cut -c1-8).js"
    mv "$js" "$(dirname "$js")/$new"
    find "$OUT" -name '*.html' -exec sed -i "s#$old#$new#g" {} +
  done
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
