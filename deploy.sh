#!/bin/bash

set -e  # Exit on any error

REPO="marsdevd/btc-wss-listener"
TAG=$(date +"%Y%m%d-%H%M%S")  # Timestamp-based tag
FULL_TAG="$REPO:$TAG"
LATEST_TAG="$REPO:latest"

echo "📁 Navigating to project directory..."
cd ~/btc-wss-listener

echo "🔄 Pulling latest code from Git..."
git pull origin main

echo "🛑 Stopping existing container..."
docker stop btc-wss-listener || true

echo "🗑️ Removing old container..."
docker rm btc-wss-listener || true

echo "🐳 Building Docker image with tags: $FULL_TAG and $LATEST_TAG..."
docker build -t $FULL_TAG -t $LATEST_TAG .

echo "🔐 Logging into Docker Hub..."
echo "Qwerty@123" | docker login -u "marsdevd" --password-stdin

echo "📤 Pushing both tags to Docker Hub..."
docker push $FULL_TAG
docker push $LATEST_TAG

echo "🚀 Starting container on port 3000 using $FULL_TAG..."
docker run -d -p 3000:3000 --name btc-wss-listener --restart unless-stopped $FULL_TAG

echo "✅ Deployment complete! Tags pushed:"
echo "    - $FULL_TAG"
echo "    - $LATEST_TAG"
