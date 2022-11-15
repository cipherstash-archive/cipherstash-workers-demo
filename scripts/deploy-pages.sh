#!/usr/bin/env bash

set -euo pipefail

export VITE_API_DOMAIN="${1:-}"

if [ -z "${VITE_API_DOMAIN}" ]; then
  echo "Error: expected workers domain to be passed through."
  echo ""
  echo "Usage: npm run publish:app <https://my-worker.my-name.workers.dev>"
  exit 1
fi

npm run app:build

npx wrangler pages publish ./app/dist
