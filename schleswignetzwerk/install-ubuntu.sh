#!/bin/bash

# ============================================
# SchleswigNetzwerk RP - Ubuntu Server Setup
# ============================================

# Farben
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
WHITE='\033[1;37m'
GRAY='\033[0;90m'
NC='\033[0m'

echo -e "${RED}"
cat << "EOF"
██████╗  ███████╗██╗      ██████╗  ██████╗  ███████╗
██╔════╝ ██╔════╝██║     ██╔═══██╗██╔══██╗██╔════╝
██║  ███╗█████╗  ██║     ██║   ██║██████╔╝█████╗  
██║   ██║██╔══╝  ██║     ██║   ██║██╔══██╗██╔══╝  
╚██████╔╝███████╗███████╗╚██████╔╝██║  ██║███████╗
 ╚═════╝ ╚══════╝╚══════╝ ╚═════╝ ╚═╝  ╚═╝╚══════╝
EOF
echo -e "${NC}"
echo ""
echo -e "${CYAN}=============================================${NC}"
echo -e "${WHITE}SchleswigNetzwerk RP - Server Setup${CYAN}"
echo -e "${CYAN}=============================================${NC}"
echo ""

# Root Check
if [ "$EUID" -ne 0 ]; then
    echo -e "${YELLOW}⚠ Root-Rechte erforderlich${NC}"
    echo -e "${YELLOW}Bitte ausführen mit: sudo bash install.sh${NC}"
    exit 1
fi

echo -e "${GRAY}System: Ubuntu/Debian${NC}"
echo ""

# Funktion mit Ausgabe
install_package() {
    echo -e "${CYAN}▸ Installation von $1...${NC}"
    apt-get install -y $1
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✓ $1 installiert${NC}"
    else
        echo -e "${RED}✗ Fehler bei $1${NC}"
    fi
}

# System Update
echo -e "${BLUE}=== System Update ===${NC}"
apt-get update -y
echo -e "${GREEN}✓ Update abgeschlossen${NC}"
echo ""

# Apache2
echo -e "${BLUE}=== Apache2 ===${NC}"
install_package "apache2"
a2enmod rewrite ssl headers rewrite 2>/dev/null
echo ""

# PHP
echo -e "${BLUE}=== PHP ===${NC}"
install_package "php"
install_package "php-cli"
install_package "php-fpm"
install_package "php-curl"
install_package "php-gd"
install_package "php-mbstring"
install_package "php-xml"
echo ""

# Firewall
echo -e "${BLUE}=== Firewall ===${NC}"
ufw allow 80/tcp 2>/dev/null
ufw allow 443/tcp 2>/dev/null
echo -e "${GREEN}✓ Firewall Ports geöffnet${NC}"
echo ""

# Verzeichnis
echo -e "${BLUE}=== Website Verzeichnis ===${NC}"
mkdir -p /var/www/schleswignetzwerk
chown -R www-data:www-data /var/www/schleswignetzwerk
chmod -R 755 /var/www/schleswignetzwerk
echo -e "${GREEN}✓ Verzeichnis erstellt: /var/www/schleswignetzwerk${NC}"
echo ""

# VirtualHost
echo -e "${BLUE}=== Apache VirtualHost ===${NC}"
cat > /etc/apache2/sites-available/schleswignetzwerk.conf << 'VHOST'
<VirtualHost *:80>
    ServerName schleswignetzwerk.eu
    ServerAlias www.schleswignetzwerk.eu
    DocumentRoot /var/www/schleswignetzwerk

    <Directory /var/www/schleswignetzwerk>
        Options -Indexes +FollowSymLinks
        AllowOverride All
        Require all granted
    </Directory>

    ErrorLog ${APACHE_LOG_DIR}/schleswignetzwerk_error.log
    CustomLog ${APACHE_LOG_DIR}/schleswignetzwerk_access.log combined
</VirtualHost>
VHOST

a2ensite schleswignetzwerk.conf 2>/dev/null
a2dissite 000-default.conf 2>/dev/null
echo -e "${GREEN}✓ VirtualHost erstellt${NC}"
echo ""

# Apache neu starten
echo -e "${BLUE}=== Apache ===${NC}"
systemctl restart apache2
systemctl enable apache2
echo -e "${GREEN}✓ Apache gestartet${NC}"
echo ""

# Status
echo -e "${BLUE}=== Status ===${NC}"
systemctl status apache2 | head -5
echo ""

# IP
PUBLIC_IP=$(curl -s ifconfig.me 2>/dev/null || curl -s ipinfo.io/ip 2>/dev/null || echo "nicht verfuegbar")
LOCAL_IP=$(hostname -I 2>/dev/null | awk '{print $1}')

echo -e "${GREEN}=============================================${NC}"
echo -e "${WHITE}✓ Installation abgeschlossen!${GREEN}"
echo -e "${GREEN}=============================================${NC}"
echo ""

echo -e "${WHITE}=============================================${NC}"
echo -e "${CYAN}Server Informationen:${WHITE}"
echo -e "${WHITE}=============================================${NC}"
echo -e "${GRAY} Domain:    ${GREEN}https://schleswignetzwerk.eu${NC}"
echo -e "${GRAY} Lokale IP: ${GREEN}$LOCAL_IP${NC}"
echo -e "${GRAY} Public IP: ${GREEN}$PUBLIC_IP${NC}"
echo -e "${GRAY} Port:      ${GREEN}80${NC}"
echo -e "${GRAY} Webroot:   ${GREEN}/var/www/schleswignetzwerk${NC}"
echo ""

echo -e "${YELLOW}Nächste Schritte:${NC}"
echo -e "  ${WHITE}1.${NC} DNS A-Record auf $PUBLIC_IP setzen"
echo -e "  ${WHITE}2.${NC} Dateien nach /var/www/schleswignetzwerk hochladen"
echo -e "  ${WHITE}3.${NC} Discord Redirect: https://schleswignetzwerk.eu/login/callback.php"
echo -e "  ${WHITE}4.${NC} Proxy Manager konfigurieren"
echo ""

echo -e "${GREEN}Viel Erfolg! 🚀${NC}"
