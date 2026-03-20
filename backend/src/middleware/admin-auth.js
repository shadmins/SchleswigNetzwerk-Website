'use strict';

const jwt = require('jsonwebtoken');
const pool = require('../db/pool');

/**
 * Prüft ob User Admin-Zugriff hat
 */
async function requireAdmin(req, res, next) {
    try {
        // Token aus Cookie oder Authorization Header holen
        const token = req.cookies.auth_token || req.headers.authorization?.replace('Bearer ', '');
        
        if (!token) {
            return res.status(401).json({ error: 'Authentifizierung erforderlich' });
        }

        // JWT verifizieren
        let decoded;
        try {
            decoded = jwt.verify(token, process.env.JWT_SECRET || 'dev-secret');
        } catch (err) {
            return res.status(401).json({ error: 'Token ungültig' });
        }

        // User aus DB laden und Rolle prüfen
        const [users] = await pool.execute(
            'SELECT id, email, discord_id, role FROM users WHERE id = ? AND role = "admin"',
            [decoded.sub]
        );

        if (users.length === 0) {
            return res.status(403).json({ error: 'Admin-Zugriff erforderlich' });
        }

        // Request mit User-Daten anreichern
        req.user = users[0];
        req.token = token;
        next();
    } catch (err) {
        console.error('[Admin Middleware] Error:', err.message);
        res.status(500).json({ error: 'Server-Fehler' });
    }
}

/**
 * Prüft ob User Editor+Admin-Zugriff hat
 */
async function requireEditor(req, res, next) {
    try {
        const token = req.cookies.auth_token || req.headers.authorization?.replace('Bearer ', '');
        
        if (!token) {
            return res.status(401).json({ error: 'Authentifizierung erforderlich' });
        }

        let decoded;
        try {
            decoded = jwt.verify(token, process.env.JWT_SECRET || 'dev-secret');
        } catch (err) {
            return res.status(401).json({ error: 'Token ungültig' });
        }

        const [users] = await pool.execute(
            'SELECT id, email, discord_id, role FROM users WHERE id = ? AND (role = "admin" OR role = "editor")',
            [decoded.sub]
        );

        if (users.length === 0) {
            return res.status(403).json({ error: 'Editor-Zugriff erforderlich' });
        }

        req.user = users[0];
        req.token = token;
        next();
    } catch (err) {
        console.error('[Editor Middleware] Error:', err.message);
        res.status(500).json({ error: 'Server-Fehler' });
    }
}

module.exports = {
    requireAdmin,
    requireEditor
};
