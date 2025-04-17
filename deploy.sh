#!/bin/bash

set -e  # Exit on any error

REPO="marsdevd/btc-wss-listener"
TAG="latest"
FULL_TAG="$REPO:$TAG"

echo "📁 Navigating to project directory..."
cd ~/btc-wss-listener

echo "🔄 Pulling latest code from Git..."
git pull origin main

echo "🛑 Stopping existing container..."
docker stop btc-wss-listener || true

echo "🗑️ Removing old container..."
docker rm btc-wss-listener || true

echo "🐳 Building Docker image with tag $FULL_TAG..."
docker build -t $FULL_TAG -t btc-wss-listener:latest .

echo "🔐 Logging into Docker Hub..."
echo "$DOCKER_PASSWORD" | docker login -u "$DOCKER_USERNAME" --password-stdin

echo "📤 Pushing image to Docker Hub..."
docker push $FULL_TAG

echo "🚀 Starting container on port 3000 using $FULL_TAG..."
docker run -d -p 3000:3000 --name btc-wss-listener --restart unless-stopped $FULL_TAG

echo "✅ Deployment complete and Docker Hub updated!"

