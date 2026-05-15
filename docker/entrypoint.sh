#!/bin/bash
set -e

# ============================================================
# Sub-Store Docker Entrypoint
# 1. Validate local JSON data (if present)
# 2. Restore data from Cloudflare R2 (if needed)
# 3. Start supervisord (substore + wrapper + r2sync)
# ============================================================

DATA_DIR="${SUB_STORE_DATA_BASE_PATH:-/data}"
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

echo "[ENTRYPOINT] ========================================"
echo "[ENTRYPOINT]  Sub-Store Docker Container Starting"
echo "[ENTRYPOINT]  Data dir: ${DATA_DIR}"
echo "[ENTRYPOINT] ========================================"

# Backend always on internal fixed port; wrapper listens on platform PORT
export SUB_STORE_BACKEND_API_PORT="${SUB_STORE_BACKEND_API_PORT:-3001}"
if [ -n "${PORT}" ]; then
    echo "[ENTRYPOINT] Platform PORT=${PORT}, wrapper will listen on it"
fi
echo "[ENTRYPOINT] Backend internal port: ${SUB_STORE_BACKEND_API_PORT}"

mkdir -p "${DATA_DIR}"

validate_json() {
    local file="$1"
    if [ -f "${file}" ]; then
        if node -e "JSON.parse(require('fs').readFileSync('${file}','utf-8')); console.log('OK')" 2>&1; then
            echo "[ENTRYPOINT] ${file} is valid JSON"
        else
            echo "[ENTRYPOINT] ERROR: ${file} is corrupt, removing..."
            rm -f "${file}"
        fi
    fi
}

# --- R2 Restore ---
if [ -n "${R2_ENDPOINT_URL}" ] && [ -n "${R2_BUCKET}" ] && [ -n "${R2_ACCESS_KEY_ID}" ] && [ -n "${R2_SECRET_ACCESS_KEY}" ]; then
    if [ ! -f "${DATA_DIR}/sub-store.json" ]; then
        echo "[ENTRYPOINT] No local data found, restoring from R2..."
        "${SCRIPT_DIR}/restore.sh"
    else
        echo "[ENTRYPOINT] Local data exists, validating..."
        validate_json "${DATA_DIR}/sub-store.json"
        validate_json "${DATA_DIR}/root.json"

        if [ ! -f "${DATA_DIR}/sub-store.json" ]; then
            echo "[ENTRYPOINT] Local data was corrupt, restoring from R2..."
            "${SCRIPT_DIR}/restore.sh"
        else
            echo "[ENTRYPOINT] Local data valid, skipping R2 restore"
        fi
    fi

    if [ -f "${DATA_DIR}/sub-store.json" ]; then
        validate_json "${DATA_DIR}/sub-store.json"
    fi
else
    echo "[ENTRYPOINT] R2 not configured, skipping backup/restore"
fi

echo "[ENTRYPOINT] Starting supervisord..."
exec supervisord -c "${SCRIPT_DIR}/supervisord.conf"
