#!/bin/bash
# Test Docker build locally before pushing

set -e

echo "🐳 Testing Docker build locally..."
echo ""

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker Desktop."
    exit 1
fi

# Build the Docker image
echo "📦 Building Docker image..."
docker build -t prophet-indexer-test -f Dockerfile .

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Docker build successful!"
    echo ""
    echo "Testing codegen in container..."
    docker run --rm prophet-indexer-test npm run codegen
    
    if [ $? -eq 0 ]; then
        echo ""
        echo "✅ Codegen test passed!"
        echo ""
        echo "🚀 Ready to push! The build should work on Railway."
    else
        echo ""
        echo "❌ Codegen test failed!"
        exit 1
    fi
else
    echo ""
    echo "❌ Docker build failed!"
    exit 1
fi
