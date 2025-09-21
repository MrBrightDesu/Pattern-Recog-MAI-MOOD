#!/bin/bash

# MAI Mood Coach Docker Management Script

case "$1" in
  "build")
    echo "🔨 Building MAI Mood Coach Docker image..."
    docker build -t mai-mood-coach .
    echo "✅ Build completed!"
    ;;
  "build-dev")
    echo "🔨 Building MAI Mood Coach Development Docker image..."
    docker build -f Dockerfile.dev -t mai-mood-coach-dev .
    echo "✅ Development build completed!"
    ;;
  "run")
    echo "🚀 Running MAI Mood Coach in production mode..."
    docker run -d -p 3000:3000 --name mai-mood-coach-app mai-mood-coach
    echo "✅ Application is running at http://localhost:3000"
    ;;
  "run-dev")
    echo "🚀 Running MAI Mood Coach in development mode..."
    docker-compose -f docker-compose.dev.yml up --build
    ;;
  "stop")
    echo "🛑 Stopping MAI Mood Coach..."
    docker stop mai-mood-coach-app
    docker rm mai-mood-coach-app
    echo "✅ Application stopped!"
    ;;
  "stop-dev")
    echo "🛑 Stopping MAI Mood Coach Development..."
    docker-compose -f docker-compose.dev.yml down
    echo "✅ Development environment stopped!"
    ;;
  "logs")
    echo "📋 Showing logs..."
    docker logs mai-mood-coach-app
    ;;
  "logs-dev")
    echo "📋 Showing development logs..."
    docker-compose -f docker-compose.dev.yml logs
    ;;
  "clean")
    echo "🧹 Cleaning up Docker resources..."
    docker stop mai-mood-coach-app 2>/dev/null || true
    docker rm mai-mood-coach-app 2>/dev/null || true
    docker rmi mai-mood-coach 2>/dev/null || true
    docker-compose -f docker-compose.dev.yml down 2>/dev/null || true
    echo "✅ Cleanup completed!"
    ;;
  *)
    echo "MAI Mood Coach Docker Management"
    echo ""
    echo "Usage: $0 {build|build-dev|run|run-dev|stop|stop-dev|logs|logs-dev|clean}"
    echo ""
    echo "Commands:"
    echo "  build      - Build production Docker image"
    echo "  build-dev  - Build development Docker image"
    echo "  run        - Run production container"
    echo "  run-dev    - Run development environment with hot reload"
    echo "  stop       - Stop production container"
    echo "  stop-dev   - Stop development environment"
    echo "  logs       - Show production logs"
    echo "  logs-dev   - Show development logs"
    echo "  clean      - Clean up all Docker resources"
    ;;
esac
