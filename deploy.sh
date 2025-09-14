#!/bin/bash

echo "🚀 Vibe Kanban Docker Deployment Script"
echo "======================================="

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker first."
    exit 1
fi

# Check Docker daemon
if ! docker info &> /dev/null; then
    echo "❌ Docker daemon is not running or you don't have permission."
    echo "   Try: sudo usermod -aG docker $USER"
    echo "   Then logout and login again."
    exit 1
fi

# Function to build and run with Docker
deploy_with_docker() {
    echo "📦 Building Docker image..."

    # Build the image
    docker build -t vibe-kanban:latest . 2>&1 | grep -E "^(Step|Successfully|ERROR)"

    if [ $? -ne 0 ]; then
        echo "❌ Build failed. Trying alternative approach..."
        deploy_dev_mode
        return
    fi

    echo "✅ Build successful!"

    # Stop existing container if running
    docker stop vibe-kanban 2>/dev/null
    docker rm vibe-kanban 2>/dev/null

    echo "🚀 Starting container..."
    docker run -d \
        --name vibe-kanban \
        -p 3000:3000 \
        -p 3001:3001 \
        -p 3002:3002 \
        -v $(pwd)/data:/app/data \
        --restart unless-stopped \
        vibe-kanban:latest

    echo "✅ Container started!"
}

# Function to deploy in dev mode
deploy_dev_mode() {
    echo "🔧 Starting in development mode..."

    # Create a simple run script
    cat > run-docker.sh << 'EOF'
#!/bin/sh
cd /app
npm install -g pnpm@8.15.1
pnpm install
cd apps/server && pnpm dev &
SERVER_PID=$!
cd ../web && pnpm dev &
WEB_PID=$!
echo "Services started. PIDs: Server=$SERVER_PID, Web=$WEB_PID"
wait
EOF

    chmod +x run-docker.sh

    docker run -d \
        --name vibe-kanban \
        -p 3000:3000 \
        -p 3001:3001 \
        -p 3002:3002 \
        -v $(pwd):/app \
        -w /app \
        --restart unless-stopped \
        node:20-alpine \
        sh -c "apk add --no-cache python3 make g++ bash && /app/run-docker.sh"

    echo "✅ Development container started!"
}

# Function to check status
check_status() {
    echo ""
    echo "📊 Checking container status..."

    if docker ps | grep -q vibe-kanban; then
        echo "✅ Container is running"
        echo ""
        echo "🌐 Access URLs:"
        echo "   Frontend: http://localhost:3000"
        echo "   Backend API: http://localhost:3001/health"
        echo "   Collaboration: ws://localhost:3002"
        echo ""
        echo "📝 Logs: docker logs -f vibe-kanban"
        echo "🛑 Stop: docker stop vibe-kanban"
    else
        echo "❌ Container is not running"
        echo "   Check logs: docker logs vibe-kanban"
    fi
}

# Main execution
case "${1:-build}" in
    build)
        deploy_with_docker
        check_status
        ;;
    dev)
        deploy_dev_mode
        check_status
        ;;
    status)
        check_status
        ;;
    stop)
        echo "🛑 Stopping container..."
        docker stop vibe-kanban
        docker rm vibe-kanban
        echo "✅ Container stopped and removed"
        ;;
    logs)
        docker logs -f vibe-kanban
        ;;
    *)
        echo "Usage: $0 {build|dev|status|stop|logs}"
        echo ""
        echo "  build  - Build and run production image"
        echo "  dev    - Run in development mode"
        echo "  status - Check container status"
        echo "  stop   - Stop and remove container"
        echo "  logs   - Show container logs"
        exit 1
        ;;
esac