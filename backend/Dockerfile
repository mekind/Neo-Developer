# syntax=docker/dockerfile:1.6

# ---- builder ----------------------------------------------------------------
FROM node:25-bookworm AS builder

WORKDIR /app

# OpenSSL for Prisma engines, Python for pipeline
RUN apt-get update -y \
  && apt-get install -y --no-install-recommends \
     openssl ca-certificates python3 python3-pip python3-venv \
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

# ---- runtime ----------------------------------------------------------------
FROM node:25-bookworm AS runtime

WORKDIR /app

ENV NODE_ENV=production \
    PORT=3000 \
    PYTHONUNBUFFERED=1

# Install Python and Playwright dependencies
RUN apt-get update -y \
  && apt-get install -y --no-install-recommends \
     openssl ca-certificates python3 python3-pip python3-venv curl \
  && rm -rf /var/lib/apt/lists/*

# Install Playwright system dependencies
RUN npx playwright install-deps chromium

# Copy production deps + build artifacts
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/package.json ./package.json

# Copy LPC Character Pipeline
COPY lpc-character-pipeline ./lpc-character-pipeline

# Install Python dependencies
RUN python3 -m venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH"
RUN pip install --no-cache-dir -r lpc-character-pipeline/requirements.txt \
  && playwright install chromium

# Copy start script
COPY start.sh ./
RUN chmod +x start.sh

EXPOSE 3000 8001

# Apply migrations and start both services
CMD ["./start.sh"]
