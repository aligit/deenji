#!/bin/bash
# scripts/setup-es-network.sh

# Get the actual network name from running Supabase containers
SUPABASE_NETWORK=$(docker inspect supabase_db_deenji-supabase -f '{{range $k, $v := .NetworkSettings.Networks}}{{$k}}{{end}}')

if [ -z "$SUPABASE_NETWORK" ]; then
  echo "Error: Could not find Supabase network. Is Supabase running?"
  exit 1
fi

echo "Found Supabase network: $SUPABASE_NETWORK"

# Update the elasticsearch-compose.yml file with the correct network name
sed -i "s/name: supabase_network_deenji-supabase/name: $SUPABASE_NETWORK/g" elasticsearch-compose.yml

echo "Updated elasticsearch-compose.yml with network: $SUPABASE_NETWORK"
