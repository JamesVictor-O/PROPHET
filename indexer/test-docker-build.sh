#!/bin/bash
# Test Docker build locally before pushing

set -e

echo "🐳 Testing Docker build locally..."
echo ""

# Build the Docker image
echo "📦 Building Docker image..."
docker build -t prophet-indexer-test -f Dockerfile .

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Docker build successful!"
    echo ""
    echo "To test the container:"
    echo "  docker run --rm prophet-indexer-test npm run codegen"
    echo ""
else
    echo ""
    echo "❌ Docker build failed!"
    exit 1
fi

