#!/usr/bin/env bash

TARGET_URL="http://10.0.0.2:8080"
SLEEP_SECONDS="0.5"
COUNT=0

echo "[*] Starting benign HTTP traffic to ${TARGET_URL}"
echo "[*] Press Ctrl+C to stop"

while true; do
  curl -s "${TARGET_URL}" > /dev/null
  COUNT=$((COUNT + 1))
  echo "[*] Request count: ${COUNT}"
  sleep "${SLEEP_SECONDS}"
done
