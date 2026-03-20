# Authentik Integration - Setup Anleitung

## Überblick
Die Schleswig-Netzwerk Website nutzt **Authentik** als SSO-Provider für den **Edit/Admin-Bereich**. Das Team kann sich über das Authentik-Portal (`login.schleswignetzwerk.eu`) anmelden und hat dann Zugriff auf die Inhaltsbearbeitung.

## Was wurde implementiert

### Backend
- ✅ **Authentik OAuth2/OIDC Service** (`backend/src/services/authentik.js`)
  - Token-Exchange (Code → Access Token)
  - Benutzerinformationen abrufen
  - User Auto-Creation/Update in DB

- ✅ **Auth Routes** (`backend/src/routes/auth.js`)
  - `POST /api/auth/authentik/login` – Login starten
  - `GET /api/auth/authentik/callback` – OAuth2 Callback
  - `POST /api/auth/authentik/logout` – Logout

- ✅ **Database Schema Update**
  - Neue Spalte: `authentik_id` (UNIQUE) in `users` Tabelle
  - Index für schnelle Lookups

### Frontend
- ✅ **Edit-Login Page** (`frontend/edit/login.html`)
  - Authentik-Login Button
  - Fehlerbehandlung

- ✅ **Callback Handler** (`frontend/edit/authentik-callback.html`)
  - Empfängt OAuth2-Code
  - Tauscht gegen JWT aus
  - Speichert Token und redirected zu Editor

## Konfiguration

### 1. Authentik Admin Setup
Im Authentik Admin-Dashboard (`https://login.schleswignetzwerk.eu/if/admin/`):

1. **Neue keycloak-like Application erstellen:**
   - Name: "Schleswig-Netzwerk Editor"
   - Type: OAuth2/OIDC

2. **Client-Konfiguration:**
   - Authorization grant type: `authorization_code`
   - Redirect URIs:
     ```
     https://schleswignetzwerk.eu/edit/authentik-callback.html
     http://localhost:5500/edit/authentik-callback.html  (für dev)
     ```

3. **Scopes aktivieren:**
   - ✅ openid
   - ✅ profile
   - ✅ email

4. **Client-Credentials kopieren:**
   - CLIENT_ID (z.B. `abc123def456`)
   - CLIENT_SECRET (z.B. lange Zeichenkette)

### 2. Backend .env konfigurieren
Datei: `backend/.env`

```env
# Authentik OAuth2 Configuration
AUTHENTIK_URL=https://login.schleswignetzwerk.eu
AUTHENTIK_CLIENT_ID=<von-authentik-kopieren>
AUTHENTIK_CLIENT_SECRET=<von-authentik-kopieren>
AUTHENTIK_REDIRECT_URI=https://schleswignetzwerk.eu/edit/authentik-callback.html

# Für lokale Entwicklung:
# AUTHENTIK_REDIRECT_URI=http://localhost:5500/edit/authentik-callback.html
```

### 3. Datenbank Spalte hinzufügen
```sql
-- Falls noch nicht vorhanden
ALTER TABLE users 
ADD COLUMN `authentik_id` VARCHAR(255) DEFAULT NULL UNIQUE 
COMMENT 'Authentik User-ID (SSO)' 
AFTER `discord_username`;

ALTER TABLE users 
ADD INDEX `idx_authentik_id` (`authentik_id`);
```

## Workflow

### Team-Member Login
1. Team-Mitglied öffnet `https://schleswignetzwerk.eu/edit/login.html`
2. Klickt "Mit Authentik anmelden"
3. Wird zu `login.schleswignetzwerk.eu` weitergeleitet
4. Anmeldung mit Authentik-Credentials
5. Authorization-Code wird zu Backend gepingt
6. Backend erstellt `admin`-User in DB (mit `authentik_id`)
7. JWT wird generiert und gespeichert
8. Redirect zum Editor Dashboard mit Token

### Admin-User Erstellung
- Beim ersten Login wird automatisch ein `admin`-User erstellt
- `authentik_id` wird als Unique-ID verwendet
- User-Daten (Email, Name) werden von Authentik synchronisiert

## Sicherheit
✅ **State-Parameter** für CSRF-Schutz  
✅ **HttpOnly Cookies** für Token-Speicherung  
✅ **OIDC/OAuth2 Best Practices**  
✅ **Rate-Limiting** auf Auth-Endpoints  
✅ **XSS-Schutz** via CSP Headers

## Troubleshooting

### "Ungültiger State-Parameter"
- Cookie-Handling überprüfen
- Same-Site/Secure Cookie-Einstellungen prüfen

### "Keine Authentik-URL zurückgegeben"
- `AUTHENTIK_URL`, `AUTHENTIK_CLIENT_ID`, `AUTHENTIK_CLIENT_SECRET` korrekt?
- Authentik Server erreichbar?

### "Authentik User hat keine ID oder E-Mail"
- In Authentik: User-Profil hat E-Mail gesetzt?
- OIDC Scopes korrekt? (openid, profile, email)

## Nächste Schritte (Optional)

- [ ] Team-Mitglieder in Authentik-Gruppe registrieren
- [ ] Conditional Access Policies einrichten (IP-Whitelist, etc.)
- [ ] SAML alternativ zu OAuth2 (falls benötigt)
- [ ] Automatische Benutzer-Deprovisioning nach Verlassen des Teams

---

**Fragen?** Siehe Backend-Logs für Details zu Login-Fehlern.
