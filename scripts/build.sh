#!/bin/bash
next build

# Workaround: Next.js 16 Turbopack doesn't generate .html/.rsc
# files for special pages, but Vercel's builder expects them.
mkdir -p .next/server/app

for page in _global-error _not-found; do
  if [ ! -f ".next/server/app/${page}.html" ]; then
    echo "<html><body>Error</body></html>" > ".next/server/app/${page}.html"
  fi
  if [ ! -f ".next/server/app/${page}.rsc" ]; then
    echo "" > ".next/server/app/${page}.rsc"
  fi
done
