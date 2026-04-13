# Discord OAuth2 Setup Anleitung

## Dateien

- `config.php` - Konfiguration (Client ID, Secret, Token)
- `callback.php` - OAuth Callback Handler
- `index.php` - Startseite (mit Login-Status)
- `features.php` - Features Seite
- `team.php` - Team Seite
- `login.php` - Login Seite
- `impressum.php` - Impressum
- `logout.php` - Logout Handler

## Einrichtung im Discord Developer Portal

1. **Application erstellen:**
   https://discord.com/developers/applications

2. **OAuth2 Redirects hinzufügen:**
   - `https://schleswignetzwerk.eu/login/callback.php`

3. **Client Secret generieren:**
   - Im Developer Portal → OAuth2 → "Reset Secret"
   - In `config.php` bei `DISCORD_CLIENT_SECRET` einfügen

4. **Bot Token (optional für erweiterte Features):**
   - Im Developer Portal → Bot → "Reset Token"
   - In `config.php` bei `DISCORD_BOT_TOKEN` einfügen

## config.php anpassen

```php
define('DISCORD_CLIENT_ID', '1475510377524629609');
define('DISCORD_CLIENT_SECRET', 'DEIN_CLIENT_SECRET');        // ← Aus Developer Portal
define('DISCORD_REDIRECT_URI', 'https://schleswignetzwerk.eu/login/callback.php');
define('DISCORD_BOT_TOKEN', 'DEIN_BOT_TOKEN');                // ← Optional
```

## Server-Anforderungen

- PHP 7.4+
- curl Erweiterung aktiviert
- HTTPS (zwingend für OAuth)

## Funktionsweise

```
login.php → Discord Authorization → callback.php → Session → index.php
```

## Testen

1. Öffne `login.php`
2. Klicke "Mit Discord anmelden"
3. Nach Autorisierung → callback.php
4. Bei Erfolg → Session gesetzt → Weiterleitung zu index.php
5.Navbar zeigt "Logout (Username)" statt "Discord beitreten"

## Finale Dateiliste

```
schleswignetzwerk/
├── config.php
├── callback.php
├── logout.php
├── index.php          (ehemals index.html)
├── features.php       (ehemals features.html)
├── team.php          (ehemals team.html)
├── login.php         (ehemals login.html)
├── impressum.php     (ehemals impressum.html)
├── styles.css
├── script.js
└── SETUP.md
```

## Server-Anforderungen

- PHP 7.4+
- curl Erweiterung aktiviert
- HTTPS (zwingend für OAuth)

## Funktionsweise

```
login.html → Discord Authorization → callback.php → Session → index.html
```

## Testen

1. Öffne `login.html`
2. Klicke "Mit Discord anmelden"
3. Nach Autorisierung → callback.php
4. Bei Erfolg → Session gesetzt → Weiterleitung zu index.html
