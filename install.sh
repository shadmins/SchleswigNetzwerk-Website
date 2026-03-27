#!/bin/bash

# Schleswig Netzwerk - Flarum Installation Script
# Target OS: Ubuntu 22.04 LTS / Debian 12

set -e

echo "--- Updating System ---"
sudo apt update && sudo apt upgrade -y

echo "--- Installing PHP 8.1 and Dependencies ---"
# Adding PHP repository for Ubuntu if needed
if [ -f /etc/lsb-release ]; then
    sudo apt install -y software-properties-common
    sudo add-apt-repository -y ppa:ondrej/php
    sudo apt update
fi

sudo apt install -y php8.1 php8.1-cli php8.1-fpm php8.1-mysql php8.1-curl \
    php8.1-gd php8.1-mbstring php8.1-xml php8.1-zip php8.1-tokenizer \
    php8.1-bcmath unzip git curl mariadb-server apache2 certbot python3-certbot-apache

echo "--- Installing Composer ---"
curl -sS https://getcomposer.org/installer | php
sudo mv composer.phar /usr/local/bin/composer

echo "--- Setting up MariaDB ---"
# Note: mysql_secure_installation is interactive, but we can automate some parts if needed.
# For now, we assume the user might want to run it manually or we use the SQL script.
sudo mysql < db_setup.sql

echo "--- Configuring Apache ---"
sudo cp flarum.conf /etc/apache2/sites-available/flarum.conf
sudo a2enmod rewrite proxy_fcgi setenvif
sudo a2enconf php8.1-fpm
sudo a2ensite flarum.conf
sudo a2dissite 000-default.conf
sudo systemctl restart apache2

echo "--- Preparing Directory ---"
sudo mkdir -p /var/www/flarum
sudo chown -R www-data:www-data /var/www/flarum

echo "--- SSL Certificate (Optional) ---"
echo "Run: sudo certbot --apache -d forum.schleswignetzwerk.eu"

echo "Installation of base components finished."
echo "Please run setup_flarum.sh as the next step."
