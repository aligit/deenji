#!/bin/bash
# scripts/start-dev-environment.sh

echo "Starting Supabase..."
cd $HOME/work-public/deenji-supabase && bunx supabase start -x edge-runtime,vector,logflare

if [ $? -ne 0 ]; then
  echo "Failed to start Supabase"
  exit 1
fi

echo "Supabase started successfully"

# Return to the monorepo directory
cd $OLDPWD

# Set up the network for Elasticsearch
./scripts/setup-es-network.sh

if [ $? -ne 0 ]; then
  echo "Failed to set up network for Elasticsearch"
  exit 1
fi

echo "Starting Elasticsearch..."
docker compose -f elasticsearch-compose.yml up -d

echo "Development environment is ready!"
