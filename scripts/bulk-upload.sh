#!/usr/bin/env bash

WORKER_BASE_URL=${1:-}

if [ -z "$WORKER_BASE_URL" ]; then
  echo "Usage: ./scripts/bulk-upload.sh <worker url>" >&2
  echo "Example: ./scripts/bulk-upload.sh https://cipherstash-demo.foo.workers.dev" >&2
  exit 1
fi

auth_preflight() {
  curl "$WORKER_BASE_URL/auth-preflight" \
    -X 'POST' \
    --cookie-jar cookies.txt \
    --compressed \
    --silent;
  echo;
}

insert_patient() {
  curl "$WORKER_BASE_URL/secure" \
    -H 'Content-Type: application/json; charset=utf-8' \
    -X 'POST' \
    --cookie-jar cookies.txt \
    --cookie cookies.txt \
    --data "$1" \
    --compressed \
    --silent;
  echo;
}

echo 'running auth-preflight'
auth_preflight

CURRENT=0;
COUNT=$(jq '. | length' patients.data.json)

jq -c '.[]' patients.data.json | while read i; do
    CURRENT=$((CURRENT+1));
    echo Creating patient data $CURRENT/$COUNT
    insert_patient "$i"
done
