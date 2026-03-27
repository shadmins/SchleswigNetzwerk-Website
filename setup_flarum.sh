#!/bin/bash

# Schleswig Netzwerk - Flarum Setup Script
# Run this after install.sh

set -e

cd /var/www/flarum

echo "--- Installing Flarum via Composer ---"
sudo -u www-data composer create-project flarum/flarum .

echo "--- Setting Permissions ---"
sudo chown -R www-data:www-data /var/www/flarum
sudo chmod -R 755 /var/www/flarum
sudo chmod -R 775 /var/www/flarum/storage /var/www/flarum/public/assets

echo "--- Installing SSO and Extensions ---"
sudo -u www-data composer require flarum-community/auth-oidc flarum/flags flarum/sticky

echo "Flarum setup and extension installation complete."
echo "Visit https://forum.schleswignetzwerk.eu to finish the web setup."
echo "Then activate 'OpenID Connect' in the Admin panel."
