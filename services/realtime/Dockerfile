# ============================================
# BUILD STAGE
# ============================================
FROM node:20-alpine AS builder

WORKDIR /workspace

# Copy root package files for workspaces
COPY package*.json ./

# Copy all workspace packages
COPY services/api/package*.json ./services/api/
COPY services/discord-bot/package*.json ./services/discord-bot/
COPY services/fcm/package*.json ./services/fcm/
COPY services/processor/package*.json ./services/processor/
COPY services/realtime/package*.json ./services/realtime/
COPY test-producer/package*.json ./test-producer/

# Install all dependencies (workspaces will share common deps)
RUN npm ci && npm cache clean --force

# Copy source code for this service
COPY services/realtime ./services/realtime

# Build this service
WORKDIR /workspace/services/realtime
RUN npm run build

# ============================================
# PRODUCTION STAGE
# ============================================
FROM node:20-alpine AS production

RUN apk add --no-cache dumb-init

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

WORKDIR /workspace

# Copy root package files
COPY package*.json ./

# Copy workspace package files
COPY services/realtime/package*.json ./services/realtime/

# Install production dependencies (workspaces will optimize this)
RUN npm ci --omit=dev && npm cache clean --force

# Copy built files
COPY --from=builder /workspace/services/realtime/dist ./services/realtime/dist

RUN chown -R nodejs:nodejs /workspace
USER nodejs

WORKDIR /workspace/services/realtime

EXPOSE 3000

ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "dist/index.js"]
