# Dockerfile
FROM oven/bun:1-alpine AS builder

WORKDIR /app

# Copy workspace configuration files
COPY package*.json ./
COPY bun.lockb ./
COPY nx.json ./
COPY tsconfig.base.json ./

# Install dependencies with bun
RUN bun install --frozen-lockfile

# Copy source code
COPY . .

# Build the deenji app
RUN bunx nx build deenji --configuration=production

# Production stage
FROM oven/bun:1-alpine

WORKDIR /app

# Install dumb-init for proper signal handling
RUN apk add --no-cache dumb-init

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Copy built application
COPY --from=builder --chown=nodejs:nodejs /app/dist/deenji ./dist/deenji

# Switch to non-root user
USER nodejs

# Expose port
EXPOSE 8081

# Use dumb-init to handle signals properly
ENTRYPOINT ["dumb-init", "--"]

# Start the server with bun
CMD ["bun", "run", "dist/deenji/analog/server/index.mjs"]
