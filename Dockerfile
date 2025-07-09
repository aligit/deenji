# Dockerfile
FROM oven/bun:latest-alpine AS builder
ENV NG_CLI_ANALYTICS=false
ENV NODE_OPTIONS="--max-old-space-size=6144"

WORKDIR /app

# Copy workspace configuration files
COPY package.json bun.lockb ./
COPY nx.json ./
COPY tsconfig.base.json ./
COPY deenji/vite.config.ts ./vite.config.ts

# Install dependencies with npm
RUN bun install

# Copy source code
COPY . .

# Build the deenji app
#RUN npx nx build deenji --configuration=production
RUN NODE_ENV=production bunx nx build deenji --configuration=production --skip-nx-cache

# Production stage
FROM node:20-alpine

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

# Start the server with node
CMD ["node", "dist/deenji/analog/server/index.mjs"]
