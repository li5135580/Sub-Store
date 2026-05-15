# Stage 1: Build the application bundle
FROM node:24.15.0-slim AS builder

RUN corepack enable && corepack prepare pnpm@11.0.9 --activate

WORKDIR /app

COPY backend/package.json backend/pnpm-lock.yaml backend/pnpm-workspace.yaml ./
COPY backend/patches ./patches

RUN pnpm i --no-frozen-lockfile

COPY backend/ ./

RUN pnpm bundle:esbuild

# Stage 2: Build frontend
FROM node:24.15.0-slim AS frontend-builder

RUN apt-get update && apt-get install -y --no-install-recommends \
    git \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

RUN corepack enable && corepack prepare pnpm@11.0.9 --activate

WORKDIR /frontend

ARG FRONTEND_REPO=https://github.com/sub-store-org/Sub-Store-FrontEnd.git
ARG FRONTEND_REF=master

RUN git clone --depth 1 --branch "${FRONTEND_REF}" "${FRONTEND_REPO}" .

RUN pnpm install --no-frozen-lockfile
RUN pnpm build

# Stage 3: Production runtime
FROM node:24.15.0-slim

RUN apt-get update && apt-get install -y --no-install-recommends \
    ca-certificates \
    awscli \
    supervisor \
    zstd \
    && rm -rf /var/lib/apt/lists/*

RUN corepack enable && corepack prepare pnpm@11.0.9 --activate

WORKDIR /app

COPY backend/package.json backend/pnpm-lock.yaml backend/pnpm-workspace.yaml ./
COPY backend/patches ./patches

RUN pnpm i --no-frozen-lockfile --prod

COPY --from=builder /app/sub-store.min.js ./
COPY --from=builder /app/dist ./dist

COPY --from=frontend-builder /frontend/dist /app/frontend

COPY docker/entrypoint.sh /usr/local/bin/
COPY docker/restore.sh   /usr/local/bin/
COPY docker/sync.sh      /usr/local/bin/
COPY docker/wrapper.js   /app/
COPY docker/admin         /app/admin
COPY docker/supervisord.conf /usr/local/bin/
RUN chmod +x /usr/local/bin/entrypoint.sh /usr/local/bin/restore.sh /usr/local/bin/sync.sh

ENV SUB_STORE_BACKEND_API_HOST=0.0.0.0
ENV SUB_STORE_DATA_BASE_PATH=/data
ENV SUB_STORE_ADMIN_PATH=/app/admin

RUN mkdir -p /data

VOLUME ["/data"]

EXPOSE 3000

ENTRYPOINT ["/usr/local/bin/entrypoint.sh"]
