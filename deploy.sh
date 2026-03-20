#!/bin/bash
# SchleswigNetzwerk-Website Deployment Script for Ubuntu
# Usage: sudo ./deploy.sh <domain>

set -e

DOMAIN="$1"
REPO="https://github.com/shadmins/SchleswigNetzwerk-Website.git"
PROJECT_DIR="/opt/SchleswigNetzwerk-Website"

if [ -z "$DOMAIN" ]; then
  echo "Usage: sudo ./deploy.sh <domain>"
  exit 1
fi

# Update and install dependencies
apt update && apt upgrade -y
apt install -y git curl

if ! command -v node >/dev/null; then
  curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
  apt install -y nodejs
fi

# Clone repo
if [ ! -d "$PROJECT_DIR" ]; then
  git clone "$REPO" "$PROJECT_DIR"
else
  cd "$PROJECT_DIR"
  git pull
fi

# Install backend dependencies
cd "$PROJECT_DIR/backend"
npm install

# Install bot dependencies
cd "$PROJECT_DIR/bot"
npm install

# Setup pm2 (if not present)
npm install -g pm2

# Start backend and bot
cd "$PROJECT_DIR/backend/src"
pm2 start app.js --name backend
cd "$PROJECT_DIR/bot/src"
pm2 start index.js --name bot
pm2 save
pm2 startup

echo "Deployment complete! Backend: http://localhost:3000, Bot: running, Domain: https://$DOMAIN"
echo "Deployment complete! Backend läuft auf http://localhost:3000, Bot läuft ebenfalls."
echo "Bitte konfiguriere den externen nginx-Reverse-Proxy so, dass Anfragen an Port 443 auf http://<server-ip>:3000 weitergeleitet werden."
