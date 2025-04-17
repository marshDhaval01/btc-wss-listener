#!/bin/bash

echo "📥 Pulling latest image from Docker Hub..."
docker pull marsdevd/btc-wss-listener:latest

echo "🛑 Stopping and removing old container..."
docker stop btc-wss-listener 2>/dev/null
docker rm btc-wss-listener 2>/dev/null

echo "🚀 Running updated container..."
docker run -d -p 3000:3000 --name btc-wss-listener --restart unless-stopped marsdevd/btc-wss-listener:latest

echo "✅ Deployment complete. Container is running on port 3000."
