# Build stage for frontend
FROM node:20-alpine AS frontend-build
WORKDIR /app/frontend
COPY frontend/package.json ./
RUN npm install
COPY frontend/ ./
RUN npm run build

# Production stage
# Use Debian slim instead of Alpine because livekit-agents depends on
# livekit-blingfire, which does not publish Alpine/musl wheels.
FROM node:20-bookworm-slim AS production
WORKDIR /app

# Python runtime for the LiveKit agent that is spawned by the backend
RUN apt-get update && \
  apt-get install -y --no-install-recommends python3 python3-venv python3-pip curl ca-certificates && \
  rm -rf /var/lib/apt/lists/* && \
  python3 -m venv /opt/venv

ENV PATH="/opt/venv/bin:$PATH" \
  PYTHON_BIN=python3 \
  AGENT_DIR=/app/agent

# Copy backend files
COPY backend/package.json ./
RUN npm install --production

COPY backend/src/ ./src/

# Copy and install Python LiveKit agent
COPY agent/requirements.txt ./agent/requirements.txt
RUN pip install --no-cache-dir -r ./agent/requirements.txt
COPY agent/ ./agent/

# Copy frontend build
COPY --from=frontend-build /app/frontend/dist ./public

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD curl --fail http://localhost:3000/api/health || exit 1

# Expose port
EXPOSE 3000

# Set environment
ENV NODE_ENV=production

# Start server
CMD ["node", "src/index.js"]
