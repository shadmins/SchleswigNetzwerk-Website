# Flarum Setup for Schleswig Netzwerk

This folder contains the automated setup scripts for the Flarum forum.

## Files
- `install.sh`: Installs OS dependencies (PHP, MariaDB, Apache, Composer).
- `db_setup.sql`: SQL script to initialize the database (called by `install.sh`).
- `flarum.conf`: Apache VirtualHost configuration.
- `setup_flarum.sh`: Installs Flarum and required extensions.
- `SSO_GUIDE.md`: Instructions for configuring the OpenID Connect integration.

## Usage
1. Upload all files to your Ubuntu/Debian server.
2. Edit `db_setup.sql` to set a secure password.
3. Make scripts executable: `chmod +x *.sh`
4. Run the components installer: `./install.sh`
5. Run the Flarum installer: `./setup_flarum.sh`
6. Finish the setup in your browser: `https://forum.schleswignetzwerk.eu`
