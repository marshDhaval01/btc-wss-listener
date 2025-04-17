#!/bin/bash

set -e  # Exit on any error

echo "📁 Navigating to project directory..."
cd ~/btc-wss-listener

echo "🔄 Pulling latest code from Git..."
git pull origin main

echo "🛑 Stopping existing container..."
docker stop btc-wss-listener || true

echo "🗑️ Removing old container..."
docker rm btc-wss-listener || true

echo "🐳 Building new Docker image..."
docker build -t btc-wss-listener .

echo "🚀 Starting container on port 3000..."
docker run -d -p 3000:3000 --name btc-wss-listener --restart unless-stopped btc-wss-listener

echo "✅ Deployment complete! Listener is live on port 3000."
