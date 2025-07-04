# Dockerfile
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY nx.json ./
COPY tsconfig.base.json ./

# Install dependencies
RUN npm ci

# Copy the entire workspace
COPY . .

# Build the deenji app specifically
RUN npx nx build deenji --configuration=production

# Production stage
FROM node:20-alpine

WORKDIR /app

# Copy the built AnalogJS output
COPY --from=builder /app/dist/deenji /app/dist/deenji

# Install production dependencies for running the server
RUN npm install nitropack

# Expose port 8081 (to match your Caddy setup)
EXPOSE 8081

# Set the port via environment variable
ENV NITRO_PORT=8081
ENV NITRO_HOST=0.0.0.0

CMD ["node", "dist/deenji/analog/server/index.mjs"]
