#!/bin/bash
# ============================================================
# Schleswig-Netzwerk Hardcore-API – Automatisches Install-Script
# Für: Linux (Ubuntu/Debian), Apache2, MySQL, Node.js
# Ausführen mit: sudo bash install.sh
# ============================================================

set -euo pipefail

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo ""
echo -e "${RED}╔══════════════════════════════════════════════════╗${NC}"
echo -e "${RED}║  ${NC}SCHLESWIG-NETZWERK HARDCORE-API INSTALLER  ${RED}║${NC}"
echo -e "${RED}╚══════════════════════════════════════════════════╝${NC}"
echo ""

# ── Root-Check ─────────────────────────────────────────────────
if [ "$EUID" -ne 0 ]; then
  echo -e "${RED}❌ Bitte als root ausführen: sudo bash install.sh${NC}"
  exit 1
fi

INSTALL_DIR="$(cd "$(dirname "$0")" && pwd)"
echo -e "${GREEN}📁 Installationsverzeichnis: ${INSTALL_DIR}${NC}"
echo ""

# ── Paket-Manager erkennen ─────────────────────────────────────
if command -v apt-get &> /dev/null; then
  PKG_MANAGER="apt"
elif command -v yum &> /dev/null; then
  PKG_MANAGER="yum"
elif command -v pacman &> /dev/null; then
  PKG_MANAGER="pacman"
else
  echo -e "${RED}❌ Kein unterstützter Paket-Manager gefunden (apt/yum/pacman)${NC}"
  exit 1
fi
echo -e "${GREEN}📦 Paket-Manager: ${PKG_MANAGER}${NC}"

# ── Abhängigkeiten installieren ────────────────────────────────
echo ""
echo -e "${YELLOW}▶ Schritt 1: Abhängigkeiten installieren...${NC}"

if [ "$PKG_MANAGER" = "apt" ]; then
  apt-get update -qq
  apt-get install -y -qq curl git apache2 mysql-server certbot python3-certbot-apache
  # Node.js 20 via NodeSource
  if ! command -v node &> /dev/null; then
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
    apt-get install -y -qq nodejs
  fi
elif [ "$PKG_MANAGER" = "yum" ]; then
  yum install -y curl git httpd mysql-server certbot python3-certbot-apache
  if ! command -v node &> /dev/null; then
    curl -fsSL https://rpm.nodesource.com/setup_20.x | bash -
    yum install -y nodejs
  fi
fi

# PM2 für Process Management
npm install -g pm2 2>/dev/null || true

echo -e "${GREEN}✅ Abhängigkeiten installiert${NC}"

# ── MySQL Konfiguration ───────────────────────────────────────
echo ""
echo -e "${YELLOW}▶ Schritt 2: Datenbank einrichten...${NC}"

read -p "MySQL Root-Passwort (Enter=leer): " -s MYSQL_ROOT_PASS
echo ""
read -p "Neues DB-Passwort für User 'schleswig': " -s DB_PASS
echo ""

MYSQL_CMD="mysql"
if [ -n "$MYSQL_ROOT_PASS" ]; then
  MYSQL_CMD="mysql -u root -p$MYSQL_ROOT_PASS"
fi

$MYSQL_CMD -u root <<EOF
CREATE DATABASE IF NOT EXISTS schleswig_netzwerk CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER IF NOT EXISTS 'schleswig'@'localhost' IDENTIFIED BY '$DB_PASS';
GRANT ALL PRIVILEGES ON schleswig_netzwerk.* TO 'schleswig'@'localhost';
FLUSH PRIVILEGES;
EOF

$MYSQL_CMD -u root schleswig_netzwerk < "${INSTALL_DIR}/backend/src/db/schema.sql" 2>/dev/null || \
  echo -e "${YELLOW}⚠ Schema möglicherweise bereits importiert${NC}"

echo -e "${GREEN}✅ Datenbank eingerichtet${NC}"

# ── .env Datei erstellen ──────────────────────────────────────
echo ""
echo -e "${YELLOW}▶ Schritt 3: Konfiguration (.env)...${NC}"

# JWT Secret generieren
JWT_SECRET=$(openssl rand -hex 64)

read -p "Domain (z.B. schleswignetzwerk.eu): " DOMAIN
read -p "SMTP Host (z.B. mail.$DOMAIN): " SMTP_HOST
read -p "SMTP Port [587]: " SMTP_PORT
SMTP_PORT=${SMTP_PORT:-587}
read -p "SMTP User (z.B. system@$DOMAIN): " SMTP_USER
read -p "SMTP Passwort: " -s SMTP_PASS
echo ""
read -p "Discord Bot Token: " DISCORD_BOT_TOKEN
read -p "Discord Guild/Server ID: " DISCORD_GUILD_ID
read -p "Discord Client ID (OAuth2): " DISCORD_CLIENT_ID
read -p "Discord Client Secret (OAuth2): " -s DISCORD_CLIENT_SECRET
echo ""
read -p "Discord Verified Role ID: " DISCORD_VERIFIED_ROLE_ID
read -p "SSO Issuer URL (Authentic, Enter=skip): " SSO_ISSUER
read -p "SSO Client ID (Enter=skip): " SSO_CLIENT_ID
read -p "SSO Client Secret (Enter=skip): " -s SSO_CLIENT_SECRET
echo ""

cat > "${INSTALL_DIR}/backend/.env" <<EOF
PORT=3000
NODE_ENV=production
APP_URL=https://${DOMAIN}
ACCOUNTS_URL=https://accounts.${DOMAIN}

DB_HOST=localhost
DB_PORT=3306
DB_USER=schleswig
DB_PASS=${DB_PASS}
DB_NAME=schleswig_netzwerk

JWT_SECRET=${JWT_SECRET}
JWT_EXPIRES_IN=7d

SMTP_HOST=${SMTP_HOST}
SMTP_PORT=${SMTP_PORT}
SMTP_SECURE=false
SMTP_USER=${SMTP_USER}
SMTP_PASS=${SMTP_PASS}
MAIL_FROM="${DOMAIN} <${SMTP_USER}>"

DISCORD_CLIENT_ID=${DISCORD_CLIENT_ID}
DISCORD_CLIENT_SECRET=${DISCORD_CLIENT_SECRET}
DISCORD_REDIRECT_URI=https://${DOMAIN}/api/account/discord/callback
DISCORD_BOT_TOKEN=${DISCORD_BOT_TOKEN}
DISCORD_GUILD_ID=${DISCORD_GUILD_ID}
DISCORD_VERIFIED_ROLE_ID=${DISCORD_VERIFIED_ROLE_ID}

SSO_ISSUER=${SSO_ISSUER}
SSO_CLIENT_ID=${SSO_CLIENT_ID}
SSO_CLIENT_SECRET=${SSO_CLIENT_SECRET}
SSO_REDIRECT_URI=https://${DOMAIN}/api/sso/callback
SSO_ALLOWED_ROLES=admin,moderator,editor
EOF

echo -e "${GREEN}✅ .env erstellt${NC}"

# ── npm install ───────────────────────────────────────────────
echo ""
echo -e "${YELLOW}▶ Schritt 4: Node.js Abhängigkeiten installieren...${NC}"

cd "${INSTALL_DIR}/backend" && npm install --production
cd "${INSTALL_DIR}/bot" && npm install --production

echo -e "${GREEN}✅ npm install abgeschlossen${NC}"

# ── Apache Konfiguration ─────────────────────────────────────
echo ""
echo -e "${YELLOW}▶ Schritt 5: Apache konfigurieren...${NC}"

# Haupt-Domain
cat > /etc/apache2/sites-available/${DOMAIN}.conf <<EOF
<VirtualHost *:80>
    ServerName ${DOMAIN}
    DocumentRoot ${INSTALL_DIR}/frontend

    # API Reverse Proxy
    ProxyPreserveHost On
    ProxyPass /api/ http://127.0.0.1:3000/api/
    ProxyPassReverse /api/ http://127.0.0.1:3000/api/

    <Directory "${INSTALL_DIR}/frontend">
        AllowOverride All
        Require all granted
    </Directory>

    ErrorLog \${APACHE_LOG_DIR}/${DOMAIN}-error.log
    CustomLog \${APACHE_LOG_DIR}/${DOMAIN}-access.log combined
</VirtualHost>
EOF

# Accounts Subdomain
cat > /etc/apache2/sites-available/accounts.${DOMAIN}.conf <<EOF
<VirtualHost *:80>
    ServerName accounts.${DOMAIN}
    DocumentRoot ${INSTALL_DIR}/accounts

    # API Reverse Proxy
    ProxyPreserveHost On
    ProxyPass /api/ http://127.0.0.1:3000/api/
    ProxyPassReverse /api/ http://127.0.0.1:3000/api/

    <Directory "${INSTALL_DIR}/accounts">
        AllowOverride All
        Require all granted
    </Directory>

    ErrorLog \${APACHE_LOG_DIR}/accounts.${DOMAIN}-error.log
    CustomLog \${APACHE_LOG_DIR}/accounts.${DOMAIN}-access.log combined
</VirtualHost>
EOF

# Apache Module aktivieren
a2enmod proxy proxy_http rewrite headers 2>/dev/null || true
a2ensite ${DOMAIN}.conf accounts.${DOMAIN}.conf 2>/dev/null || true
systemctl restart apache2

echo -e "${GREEN}✅ Apache konfiguriert${NC}"

# ── SSL (Let's Encrypt, optional) ─────────────────────────────
echo ""
read -p "SSL mit Let's Encrypt einrichten? (j/n) [n]: " SSL_CONFIRM
if [ "${SSL_CONFIRM}" = "j" ] || [ "${SSL_CONFIRM}" = "J" ]; then
  certbot --apache -d ${DOMAIN} -d accounts.${DOMAIN} --non-interactive --agree-tos --email ${SMTP_USER}
  echo -e "${GREEN}✅ SSL eingerichtet${NC}"
else
  echo -e "${YELLOW}⚠ SSL übersprungen – manuell einrichten mit: certbot --apache${NC}"
fi

# ── PM2 Services ──────────────────────────────────────────────
echo ""
echo -e "${YELLOW}▶ Schritt 6: Services starten (PM2)...${NC}"

cd "${INSTALL_DIR}/backend"
pm2 start src/app.js --name "sn-api"

cd "${INSTALL_DIR}/bot"
pm2 start src/index.js --name "sn-bot"

pm2 save
pm2 startup 2>/dev/null || true

echo -e "${GREEN}✅ Services laufen${NC}"

# ── Fertig ────────────────────────────────────────────────────
echo ""
echo -e "${RED}╔══════════════════════════════════════════════════╗${NC}"
echo -e "${RED}║         ${GREEN}✅ INSTALLATION ABGESCHLOSSEN!         ${RED}║${NC}"
echo -e "${RED}╚══════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${GREEN}🌐 Website:     https://${DOMAIN}${NC}"
echo -e "${GREEN}🔑 Accounts:    https://accounts.${DOMAIN}${NC}"
echo -e "${GREEN}📡 API:         https://${DOMAIN}/api/health${NC}"
echo ""
echo -e "${YELLOW}📋 Checkliste nach der Installation:${NC}"
echo "   1. Impressum in frontend/impressum.html befüllen"
echo "   2. Discord Bot in deinen Server einladen"
echo "   3. Team-Mitglieder in der DB oder per Admin-Panel eintragen"
echo "   4. Partner-Logos hochladen"
echo "   5. Bilder in frontend/assets/img/ hinzufügen"
echo ""
echo -e "${GREEN}🛠 PM2 Status:${NC}"
pm2 status
echo ""
