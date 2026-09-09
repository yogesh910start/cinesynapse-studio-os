# ==============================================================================
# CINE-SYNAPSE STUDIO OS - Production Multi-Stage Dockerfile
# Stage 1: Build React 18 + TypeScript Frontend SPA
# Stage 2: Hardened Python 3.11 FastAPI Runtime with Static SPA Serving
# ==============================================================================

# --- Stage 1: Frontend Build ---
FROM node:20-alpine AS frontend-builder
WORKDIR /app/frontend

COPY frontend/package*.json ./
RUN npm ci

COPY frontend/ ./
RUN npm run build

# --- Stage 2: Production Python Runtime ---
FROM python:3.11-slim AS production
WORKDIR /app

# Install system dependencies (FFmpeg for proxy transcoding, curl for SRE probes)
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    ffmpeg \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# Install Python backend dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend codebase, config, assets, and storage
COPY backend/ ./backend/
COPY pyproject.toml .
COPY sample_assets/ ./sample_assets/
COPY storage/ ./storage/

# Copy compiled frontend SPA from Stage 1 into production image
COPY --from=frontend-builder /app/frontend/dist ./frontend/dist

# Create secure, unprivileged system user conforming to TPN+ Content Security guidelines
RUN useradd -u 1001 -m -s /bin/bash cinesynapse && \
    mkdir -p /app/backend/storage/local /app/storage/local && \
    chown -R cinesynapse:cinesynapse /app

USER 1001

# Production Environment Variables
ENV APP_ENV=production \
    PORT=8080 \
    HOST=0.0.0.0 \
    PYTHONPATH=/app

EXPOSE 8080 10000

# Automated SRE Health Check Probe
HEALTHCHECK --interval=15s --timeout=5s --start-period=10s --retries=3 \
  CMD curl -f http://localhost:${PORT:-8080}/healthz || exit 1

# Launch Production Uvicorn Engine (dynamically binds to Render $PORT or defaults to 8080)
CMD ["sh", "-c", "uvicorn backend.main:app --host 0.0.0.0 --port ${PORT:-8080} --workers 1"]
