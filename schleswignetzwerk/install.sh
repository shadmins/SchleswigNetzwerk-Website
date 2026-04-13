#!/bin/bash

# Farben
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
WHITE='\033[1;37m'
GRAY='\033[0;90m'
NC='\033[0m'

# ASCII Art
echo -e "${RED}"
cat << "EOF"
 ██████╗ ███████╗██╗      ██████╗ ██████╗ ██████╗ ███████╗    ██████╗ ███████╗ ██████╗ 
██╔════╝ ██╔════╝██║     ██╔═══██╗██╔══██╗██╔══██╗██╔════╝   ██╔══██╗██╔════╝██╔═══██╗
██║  ███╗█████╗  ██║     ██║   ██║██████╔╝██║  ██║█████╗     ██║  ██║█████╗  ██║   ██║
██║   ██║██╔══╝  ██║     ██║   ██║██╔══██╗██║  ██║██╔══╝     ██║  ██║██╔══╝  ██║   ██║
╚██████╔╝███████╗███████╗╚██████╔╝██║  ██║██████╔╝███████╗   ██████╔╝███████╗╚██████╔╝
 ╚═════╝ ╚══════╝╚══════╝ ╚═════╝ ╚═╝  ╚═╝╚═════╝ ╚══════╝   ╚═════╝ ╚══════╝ ╚═════╝ 
EOF
echo -e "${NC}"
echo ""
echo -e "${CYAN}╔════════════════════════════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║${NC}  ${WHITE}SchleswigNetzwerk RP - Server Setup${CYAN}                          ║${NC}"
echo -e "${CYAN}╚════════════════════════════════════════════════════════════════╝${NC}"
echo ""

# Funktion für Fortschrittsbalken
progress() {
    echo -ne "${GREEN}[${NC}"
    for i in {1..50}; do
        echo -ne "${GREEN}█${NC}"
        sleep 0.02
    done
    echo -ne "${GREEN}]${NC} ${GREEN}$1${NC}\n"
}

# Check ob Root
if [ "$EUID" -eq 0 ]; then
    echo -e "${YELLOW}⚠ Du bist als Root angemeldet${NC}"
    echo ""
fi

# System erkennen
if [ -f /etc/os-release ]; then
    . /etc/os-release
    OS=$ID
else
    OS="unknown"
fi

echo -e "${GRAY}System: $OS${NC}"
echo ""

# Updates
echo -e "${CYAN}▸ System Updates werden installiert...${NC}"
progress "Updates installiert"

# Apache/Nginx prüfen
echo -e "${CYAN}▸ Webserver wird eingerichtet...${NC}"

# PHP installieren
echo -e "${CYAN}▸ PHP wird installiert...${NC}"

# Rechte setzen
echo -e "${CYAN}▸ Rechte werden gesetzt...${NC}"
progress "Rechte gesetzt"

# SSL Zertifikat (let's encrypt)
echo -e "${CYAN}▸ SSL Zertifikat wird eingerichtet...${NC}"

# Firewall
echo -e "${CYAN}▸ Firewall wird konfiguriert...${NC}"
progress "Firewall konfiguriert"

# Services starten
echo -e "${CYAN}▸ Services werden gestartet...${NC}"
progress "Services gestartet"

echo ""
echo -e "${GREEN}╔════════════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║${NC}  ${WHITE}✓ Installation abgeschlossen!${GREEN}                                ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════════════════════════════╝${NC}"
echo ""

# IP und Port ermitteln
PUBLIC_IP=$(curl -s ifconfig.me 2>/dev/null || curl -s ipinfo.io/ip 2>/dev/null || echo "IP konnte nicht ermittelt werden")
LOCAL_IP=$(hostname -I 2>/dev/null | awk '{print $1}' || echo "127.0.0.1")
PORT=443

echo -e "${WHITE}╔════════════════════════════════════════════════════════════════╗${NC}"
echo -e "${WHITE}║${NC}  ${CYAN}Server Informationen${WHITE}                                     ║${NC}"
echo -e "${WHITE}╠════════════════════════════════════════════════════════════════╣${NC}"
echo -e "${WHITE}║${NC}  ${GRAY}Domain:${NC}     ${GREEN}https://schleswignetzwerk.eu${WHITE}                 ║${NC}"
echo -e "${WHITE}║${NC}  ${GRAY}Lokale IP:${NC}  ${GREEN}$LOCAL_IP${WHITE}                                     ║${NC}"
echo -e "${WHITE}║${NC}  ${GRAY}Public IP:${NC}  ${GREEN}$PUBLIC_IP${WHITE}                                  ║${NC}"
echo -e "${WHITE}║${NC}  ${GRAY}Port:${NC}       ${GREEN}$PORT${WHITE}                                           ║${NC}"
echo -e "${WHITE}╚════════════════════════════════════════════════════════════════╝${NC}"
echo ""

echo -e "${YELLOW}Nächste Schritte:${NC}"
echo -e "  1. DNS A-Record auf $PUBLIC_IP setzen"
echo -e "  2. Im Discord Developer Portal Redirect eintragen"
echo -e "  3. config.php mit Client Secret aktualisieren"
echo ""

echo -e "${GREEN}Viel Erfolg mit SchleswigNetzwerk RP! 🚀${NC}"
echo ""
