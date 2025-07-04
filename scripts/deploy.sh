#!/bin/bash
set -e

# Navigate to project directory
cd ~/deenji-project

# Stop Caddy if running (for port 8081)
sudo systemctl stop caddy || true

# Pull latest code from appropriate branch
git pull origin main

# Create .env file with actual secret values
cat > .env << EOF
# Environment configuration
VITE_production=$([[ "$DEPLOY_ENV" == "production" ]] && echo "true" || echo "false")
VITE_supabaseUrl=$SUPABASE_URL
baseUrl=$APP_URL

# Elasticsearch URL (will be overridden by docker-compose for internal network)
VITE_ELASTICSEARCH_URL=http://localhost:9200

# Secrets from GitHub Environment
VITE_supabaseKey=$SUPABASE_ANON_KEY
DATABASE_URL=$DATABASE_URL
VITE_GOOGLE_API_KEY=$GOOGLE_API_KEY
VITE_googleMapsApiKey=$GOOGLE_API_KEY
VITE_GOOGLE_MAPS_API_KEY=$GOOGLE_API_KEY
EOF

# Show that env file was created (without showing secrets)
echo "Created .env file with $(wc -l < .env) lines"

# Stop existing containers
docker compose down

# Build with no cache for fresh build
docker compose build --no-cache deenji-app

# Start all services
docker compose up -d

# Wait for services to be healthy
sleep 10

# Check if services are running
docker compose ps

# Clean up old images
docker image prune -f

# Show logs for debugging
echo "=== Recent logs ==="
docker compose logs --tail=50 deenji-app
