#!/bin/bash
set -e

# ============================================================
# restore.sh — Restore data from Cloudflare R2 to /data
# Downloads tar.zst archive, validates integrity, extracts
#
# Required env vars:
#   R2_ENDPOINT_URL / R2_BUCKET / R2_ACCESS_KEY_ID / R2_SECRET_ACCESS_KEY
#   R2_PREFIX (optional)
# ============================================================

DATA_DIR="${SUB_STORE_DATA_BASE_PATH:-/data}"
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

echo "[RESTORE] Restoring data from s3://${R2_BUCKET}/${S3_KEY} to ${DATA_DIR}..."

if ! aws "${AWS_ARGS[@]}" s3 ls "s3://${R2_BUCKET}/${S3_KEY}" > /dev/null 2>&1; then
    echo "[RESTORE] ${S3_KEY} not found in bucket, nothing to restore"
    exit 0
fi

echo "[RESTORE] Downloading ${S3_KEY}..."
aws "${AWS_ARGS[@]}" s3 cp "s3://${R2_BUCKET}/${S3_KEY}" "/tmp/${ARCHIVE_NAME}"

echo "[RESTORE] Verifying archive integrity..."
if ! zstd -d < "/tmp/${ARCHIVE_NAME}" | tar -t > /dev/null 2>&1; then
    echo "[RESTORE] ERROR: Archive integrity check failed, aborting"
    rm -f "/tmp/${ARCHIVE_NAME}"
    exit 1
fi

echo "[RESTORE] Extracting to ${DATA_DIR}..."
zstd -d < "/tmp/${ARCHIVE_NAME}" | tar -xf - -C "${DATA_DIR}"
rm -f "/tmp/${ARCHIVE_NAME}"

echo "[RESTORE] Complete"
