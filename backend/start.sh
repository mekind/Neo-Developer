#!/bin/bash

# Start the Python FastAPI sidecar
echo "Starting LPC Character Pipeline Sidecar..."
cd /app/lpc-character-pipeline/scripts
uvicorn api:app --host 0.0.0.0 --port 8001 --workers 1 &

# Wait for sidecar to be ready (optional but recommended)
# while ! curl -s http://localhost:8001/healthz > /dev/null; do
#   echo "Waiting for sidecar..."
#   sleep 1
# done

# Start the NestJS backend
echo "Starting NestJS Backend..."
cd /app
npx prisma migrate deploy
node dist/main.js
