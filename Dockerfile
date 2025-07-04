# Dockerfile
FROM node:20-alpine AS builder

WORKDIR /app

# Copy workspace configuration files
COPY package*.json ./
COPY nx.json ./
COPY tsconfig.base.json ./

# Install dependencies (cached layer)
RUN npm ci

# Copy source code
COPY . .

# Build the deenji app
RUN npx nx build deenji --configuration=production

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

# Start the server
CMD ["node", "dist/deenji/analog/server/index.mjs"]
