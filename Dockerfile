# Dockerfile
FROM node:22-alpine AS builder
ENV NG_CLI_ANALYTICS=false
ENV NODE_OPTIONS="--max-old-space-size=6144"

WORKDIR /app

# Copy workspace configuration files
COPY package.json package-lock.json ./
COPY nx.json ./
COPY tsconfig.base.json ./

# Install dependencies with npm
RUN npm ci

# Copy source code
COPY . .

# Build the deenji app
RUN npx nx build deenji --configuration=production

# Production stage
FROM node:22-alpine

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
