#!/bin/bash
next build

# Workaround: Next.js 16 fails to prerender _global-error.
# Create stub files so Vercel's builder doesn't crash.
mkdir -p .next/server/app
if [ ! -f .next/server/app/_global-error.html ]; then
  echo "<html><body>Error</body></html>" > .next/server/app/_global-error.html
fi
if [ ! -f .next/server/app/_global-error.rsc ]; then
  echo "" > .next/server/app/_global-error.rsc
fi
