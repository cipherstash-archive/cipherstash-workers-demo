#!/usr/bin/env bash

set -euo pipefail

echo "Generating a 16 byte encryption key."
echo ""
echo "Setting CIPHERSTASH_KEY secret using Wrangler."

node -e "let { randomBytes } = require('crypto'); console.log(randomBytes(16).toString('hex'))" | wrangler secret put CIPHERSTASH_KEY
