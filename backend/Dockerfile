# syntax=docker/dockerfile:1.6

# ---- builder ----------------------------------------------------------------
FROM node:20.13.1-bookworm-slim AS builder

WORKDIR /app

# OpenSSL for Prisma engines
RUN apt-get update -y \
  && apt-get install -y --no-install-recommends openssl ca-certificates \
  && rm -rf /var/lib/apt/lists/*

# Install dependencies (cache-friendly)
COPY package.json package-lock.json ./
COPY prisma ./prisma
RUN npm ci

# Copy the rest and build
COPY tsconfig*.json nest-cli.json ./
COPY src ./src
COPY api ./api
RUN npx prisma generate \
  && npm run build

# Drop dev dependencies for the runtime image
RUN npm prune --omit=dev


# ---- runtime ----------------------------------------------------------------
FROM node:20.13.1-bookworm-slim AS runtime

WORKDIR /app

ENV NODE_ENV=production \
    PORT=3000

RUN apt-get update -y \
  && apt-get install -y --no-install-recommends openssl ca-certificates \
  && rm -rf /var/lib/apt/lists/*

# Copy production deps + build artifacts
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/package.json ./package.json

EXPOSE 3000

# Apply migrations before starting the server.
# `prisma migrate deploy` is idempotent and safe to run on every boot.
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/main.js"]
