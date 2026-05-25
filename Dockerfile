# Build stage for frontend
FROM node:20-alpine AS frontend-build
WORKDIR /app/frontend
COPY frontend/package.json ./
RUN npm install
COPY frontend/ ./
RUN npm run build

# Production stage
FROM node:20-alpine AS production
WORKDIR /app

# Python runtime for the LiveKit agent that is spawned by the backend
RUN apk add --no-cache python3 py3-pip && \
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
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/api/health || exit 1

# Expose port
EXPOSE 3000

# Set environment
ENV NODE_ENV=production

# Start server
CMD ["node", "src/index.js"]
