#!/bin/bash
cd ~/btc-wss-listener
git pull origin main
docker stop btc-wss-listener
docker rm btc-wss-listener
docker build -t btc-wss-listener .
docker run -d -p 3000:3000 --name btc-listener --restart unless-stopped btc-wss-listener

