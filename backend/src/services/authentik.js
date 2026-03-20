'use strict';

const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const pool = require('../db/pool');

/*
 * Authentik OAuth2/OIDC Service
 * Verwaltet die SSO-Integration mit Authentik für Admin/Editor Access
 */

const AUTHENTIK_BASE = process.env.AUTHENTIK_URL || 'https://login.schleswignetzwerk.eu';
const AUTHENTIK_TOKEN_URL = `${AUTHENTIK_BASE}/api/oauth2/token/`;
const AUTHENTIK_USERINFO_URL = `${AUTHENTIK_BASE}/api/oauth2/userinfo/`;

function authentikHeaders(token = null) {
    const headers = { 'Content-Type': 'application/json' };
    if (token) {
        headers.Authorization = `Bearer ${token}`;
    }
    return headers;
}

/**
 * Generiert OAuth2 Authorization URL für Authentik
 * @returns {string} Authorization URL
 */
function getAuthorizationUrl(state) {
    const params = new URLSearchParams({
        client_id: process.env.AUTHENTIK_CLIENT_ID,
        redirect_uri: process.env.AUTHENTIK_REDIRECT_URI,
        response_type: 'code',
        scope: 'openid profile email',
        state: state,
    });
    return `${AUTHENTIK_BASE}/application/o/authorize/?${params.toString()}`;
}

/**
 * Tauscht Authorization Code gegen Access Token
 * @param {string} code - OAuth2 Authorization Code
 * @returns {Promise<{access_token: string, id_token: string, token_type: string}>}
 */
async function getAccessToken(code) {
    const res = await fetch(AUTHENTIK_TOKEN_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
            grant_type: 'authorization_code',
            code: code,
            client_id: process.env.AUTHENTIK_CLIENT_ID,
            client_secret: process.env.AUTHENTIK_CLIENT_SECRET,
            redirect_uri: process.env.AUTHENTIK_REDIRECT_URI,
        }),
    });

    if (!res.ok) {
        const error = await res.text();
        throw new Error(`Authentik Token Error: ${error}`);
    }

    return res.json();
}

/**
 * Holt Benutzerinformationen von Authentik
 * @param {string} accessToken - Authentik Access Token
 * @returns {Promise<{sub: string, email: string, name: string, preferred_username: string}>}
 */
async function getUserInfo(accessToken) {
    const res = await fetch(AUTHENTIK_USERINFO_URL, {
        headers: authentikHeaders(accessToken),
    });

    if (!res.ok) {
        const error = await res.text();
        throw new Error(`Authentik UserInfo Error: ${error}`);
    }

    return res.json();
}

/**
 * Erstellt oder aktualisiert einen Admin-User basierend auf Authentik-Daten
 * @param {Object} authentikUser - Authentik Benutzer-Daten
 * @param {string} authentikUser.sub - Eindeutige Authentik ID
 * @param {string} authentikUser.email - E-Mail-Adresse
 * @param {string} authentikUser.name - Voller Name
 * @param {string} authentikUser.preferred_username - Benutzername
 * @returns {Promise<{id: number, email: string, nickname: string, role: string}>}
 */
async function createOrUpdateAdminUser(authentikUser) {
    const { sub: authentik_id, email, name, preferred_username } = authentikUser;

    if (!authentik_id || !email) {
        throw new Error('Authentik Benutzer hat keine ID oder E-Mail');
    }

    try {
        // Prüfe ob User bereits existiert
        const [existing] = await pool.execute(
            'SELECT id, role FROM users WHERE authentik_id = ?',
            [authentik_id]
        );

        if (existing.length > 0) {
            // Update E-Mail und Name
            await pool.execute(
                'UPDATE users SET email = ?, real_name = ?, nickname = ?, updated_at = NOW() WHERE id = ?',
                [email, name || existing[0].real_name, preferred_username || existing[0].nickname, existing[0].id]
            );
            return existing[0];
        }

        // Neuen Admin-User erstellen
        const userId = crypto.randomBytes(2).readUInt16BE(0);
        const dummyPasswordHash = await bcrypt.hash(
            crypto.randomBytes(32).toString('hex'),
            12
        );

        await pool.execute(
            `INSERT INTO users 
             (email, password_hash, nickname, real_name, authentik_id, 
              is_email_verified, role, is_active, created_at, updated_at)
             VALUES (?, ?, ?, ?, ?, 1, 'admin', 1, NOW(), NOW())`,
            [email, dummyPasswordHash, preferred_username || email.split('@')[0], name || 'Authentik User', authentik_id]
        );

        return { id: userId, email, nickname: preferred_username, role: 'admin' };
    } catch (err) {
        console.error('Fehler beim Erstellen/Aktualisieren des Authentik-Users:', err);
        throw err;
    }
}

/**
 * Findet User by Authentik ID
 */
async function findByAuthentikId(authentik_id) {
    const [rows] = await pool.execute(
        'SELECT id, email, nickname, role FROM users WHERE authentik_id = ?',
        [authentik_id]
    );
    return rows.length > 0 ? rows[0] : null;
}

module.exports = {
    getAuthorizationUrl,
    getAccessToken,
    getUserInfo,
    createOrUpdateAdminUser,
    findByAuthentikId,
};
