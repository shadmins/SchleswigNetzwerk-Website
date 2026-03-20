'use strict';

const jwt = require('jsonwebtoken');
const pool = require('../db/pool');

/**
 * Middleware: JWT aus HttpOnly Cookie prüfen.
 * Setzt req.user = { id, email, role } bei Erfolg.
 */
async function requireAuth(req, res, next) {
    try {
        const token = req.cookies?.auth_token;
        if (!token) {
            return res.status(401).json({ error: 'Nicht authentifiziert' });
        }

        const payload = jwt.verify(token, process.env.JWT_SECRET);

        // Prüfen ob Session noch gültig in DB
        const [rows] = await pool.execute(
            'SELECT id FROM sessions WHERE token_hash = SHA2(?, 256) AND expires_at > NOW()',
            [token]
        );
        if (rows.length === 0) {
            return res.status(401).json({ error: 'Session abgelaufen oder ungültig' });
        }

        // User aus DB laden (aktueller Stand)
        const [users] = await pool.execute(
            'SELECT id, email, nickname, role, is_email_verified, is_discord_linked, is_active FROM users WHERE id = ?',
            [payload.sub]
        );
        if (users.length === 0 || !users[0].is_active) {
            return res.status(401).json({ error: 'Account nicht gefunden oder deaktiviert' });
        }

        req.user = users[0];
        req.token = token;
        next();
    } catch (err) {
        if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
            return res.status(401).json({ error: 'Ungültiges oder abgelaufenes Token' });
        }
        next(err);
    }
}

/**
 * Middleware: Nur für bestimmte Rollen.
 * Verwendung: requireRole('admin') oder requireRole('admin','moderator')
 */
function requireRole(...roles) {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ error: 'Nicht authentifiziert' });
        }
        if (!roles.includes(req.user.role)) {
            return res.status(403).json({ error: 'Keine Berechtigung' });
        }
        next();
    };
}

/**
 * Middleware: Nur verifizierte Accounts.
 */
function requireVerified(req, res, next) {
    if (!req.user?.is_email_verified) {
        return res.status(403).json({ error: 'E-Mail-Adresse noch nicht verifiziert' });
    }
    next();
}

module.exports = { requireAuth, requireRole, requireVerified };
