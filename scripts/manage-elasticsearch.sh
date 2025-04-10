#!/bin/bash
# scripts/manage-elasticsearch.sh

ACTION=$1

case $ACTION in
  start)
    echo "Starting Elasticsearch..."
    docker compose -f elasticsearch-compose.yml up -d
    ;;
  stop)
    echo "Stopping Elasticsearch..."
    docker compose -f elasticsearch-compose.yml down
    ;;
  restart)
    echo "Restarting Elasticsearch..."
    docker compose -f elasticsearch-compose.yml down
    docker compose -f elasticsearch-compose.yml up -d
    ;;
  status)
    echo "Elasticsearch status:"
    docker ps --filter "name=tuqdar_elasticsearch"
    ;;
  *)
    echo "Usage: $0 {start|stop|restart|status}"
    exit 1
    ;;
esac
