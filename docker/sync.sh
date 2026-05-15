#!/bin/bash

# ============================================================
# sync.sh — Periodic backup loop (managed by supervisord)
# Archives /data/*.json with tar+zstd, uploads to Cloudflare R2
#
# Required env vars:
#   R2_ENDPOINT_URL / R2_BUCKET / R2_ACCESS_KEY_ID / R2_SECRET_ACCESS_KEY
#   R2_SYNC_INTERVAL (default: 300)
#   R2_PREFIX (optional)
# ============================================================

DATA_DIR="${SUB_STORE_DATA_BASE_PATH:-/data}"
SYNC_INTERVAL="${R2_SYNC_INTERVAL:-300}"
ARCHIVE_NAME="sub-store-data.tar.zst"

export AWS_ACCESS_KEY_ID="${R2_ACCESS_KEY_ID}"
export AWS_SECRET_ACCESS_KEY="${R2_SECRET_ACCESS_KEY}"

R2_ENDPOINT="${R2_ENDPOINT_URL}"
if ! echo "${R2_ENDPOINT}" | grep -qi '^https\?://'; then
    R2_ENDPOINT="https://${R2_ENDPOINT}"
fi

AWS_ARGS=(
    --endpoint-url "${R2_ENDPOINT}"
    --region auto
    --no-paginate
)

S3_KEY="${R2_PREFIX:+${R2_PREFIX}/}${ARCHIVE_NAME}"

echo "[SYNC] Starting R2 sync daemon (interval: ${SYNC_INTERVAL}s)"

while true; do
    sleep "${SYNC_INTERVAL}"

    echo "[SYNC] $(date -Iseconds) Backing up to s3://${R2_BUCKET}/${S3_KEY}"

    if tar -C "${DATA_DIR}" -cf - sub-store.json root.json shortlinks.json 2>/dev/null | zstd -T0 -o /tmp/${ARCHIVE_NAME}; then
        if aws "${AWS_ARGS[@]}" s3 cp "/tmp/${ARCHIVE_NAME}" "s3://${R2_BUCKET}/${S3_KEY}" 2>&1; then
            echo "[SYNC] Backup successful ($(stat -c%s /tmp/${ARCHIVE_NAME} 2>/dev/null || echo '?') bytes)"
        else
            echo "[SYNC] ERROR: Failed to upload ${ARCHIVE_NAME}"
        fi
        rm -f "/tmp/${ARCHIVE_NAME}"
    else
        echo "[SYNC] ERROR: Failed to create archive"
    fi
done
