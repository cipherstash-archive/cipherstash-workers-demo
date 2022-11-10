#!/usr/bin/env bash

export VITE_API_DOMAIN=$1

npm run app:build

npx wrangler pages publish ./app/dist
