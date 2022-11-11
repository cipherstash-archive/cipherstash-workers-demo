#!/usr/bin/env bash

set -euo pipefail

echo "Creating an access key..."
CREATE_KEY_OUTPUT_PATH="$(mktemp)"
npx stash create-key --name cloudflare-worker > $CREATE_KEY_OUTPUT_PATH

CLIENT_SECRET_PATH="$(mktemp)"
grep CS_IDP_CLIENT_SECRET $CREATE_KEY_OUTPUT_PATH | cut -d '=' -f 2 > $CLIENT_SECRET_PATH

echo "Setting CIPHERSTASH_CLIENT_SECRET secret using Wrangler."
cat $CLIENT_SECRET_PATH | wrangler secret put CIPHERSTASH_CLIENT_SECRET

rm $CREATE_KEY_OUTPUT_PATH $CLIENT_SECRET_PATH
