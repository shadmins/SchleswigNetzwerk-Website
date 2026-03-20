'use strict';

const express = require('express');
const pool = require('../db/pool');
const { requireAuth, requireVerified } = require('../middleware/auth');

const router = express.Router();

const DISCORD_OAUTH_URL = 'https://discord.com/api/oauth2/authorize';
const DISCORD_TOKEN_URL = 'https://discord.com/api/oauth2/token';
const DISCORD_API_URL = 'https://discord.com/api/v10';

// ── GET /api/account/me ───────────────────────────────────────
router.get('/me', requireAuth, async (req, res, next) => {
    try {
        const [rows] = await pool.execute(
            `SELECT id, email, nickname, real_name, discord_id, discord_username,
              is_email_verified, is_discord_linked, is_discord_role_given,
              role, created_at
       FROM users WHERE id = ?`,
            [req.user.id]
        );
        if (rows.length === 0) return res.status(404).json({ error: 'Benutzer nicht gefunden' });
        res.json(rows[0]);
    } catch (err) {
        next(err);
    }
});

// ── GET /api/account/discord/connect ─────────────────────────
// Startet den Discord OAuth2 Flow
router.get('/discord/connect', requireAuth, requireVerified, (req, res) => {
    const params = new URLSearchParams({
        client_id: process.env.DISCORD_CLIENT_ID,
        redirect_uri: process.env.DISCORD_REDIRECT_URI,
        response_type: 'code',
        scope: 'identify',
        state: req.user.id.toString(), // CSRF-Schutz
    });
    res.redirect(`${DISCORD_OAUTH_URL}?${params.toString()}`);
});

// ── GET /api/account/discord/callback ────────────────────────
router.get('/discord/callback', requireAuth, async (req, res, next) => {
    const { code, state } = req.query;

    // State-Prüfung (CSRF)
    if (!state || parseInt(state) !== req.user.id) {
        return res.status(400).json({ error: 'Ungültiger State-Parameter' });
    }
    if (!code) {
        return res.status(400).json({ error: 'Kein Code von Discord erhalten' });
    }

    try {
        // Token von Discord holen
        const tokenRes = await fetch(DISCORD_TOKEN_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
                client_id: process.env.DISCORD_CLIENT_ID,
                client_secret: process.env.DISCORD_CLIENT_SECRET,
                grant_type: 'authorization_code',
                code,
                redirect_uri: process.env.DISCORD_REDIRECT_URI,
            }),
        });
        const tokenData = await tokenRes.json();
        if (!tokenData.access_token) {
            return res.status(400).json({ error: 'Discord Token-Austausch fehlgeschlagen' });
        }

        // Discord User abrufen
        const userRes = await fetch(`${DISCORD_API_URL}/users/@me`, {
            headers: { Authorization: `Bearer ${tokenData.access_token}` },
        });
        const discordUser = await userRes.json();
        if (!discordUser.id) {
            return res.status(400).json({ error: 'Discord User konnte nicht abgerufen werden' });
        }

        // Prüfen ob Discord-ID bereits von anderem Account genutzt wird
        const [existing] = await pool.execute(
            'SELECT id FROM users WHERE discord_id = ? AND id != ?',
            [discordUser.id, req.user.id]
        );
        if (existing.length > 0) {
            return res.status(409).json({ error: 'Dieser Discord-Account ist bereits mit einem anderen Account verknüpft' });
        }

        // Speichern
        await pool.execute(
            'UPDATE users SET discord_id = ?, discord_username = ?, is_discord_linked = 1 WHERE id = ?',
            [discordUser.id, `${discordUser.username}#${discordUser.discriminator || '0'}`, req.user.id]
        );

        await pool.execute(
            "INSERT INTO admin_logs (user_id, action, target_type, target_id, details) VALUES (?, 'user.discord_link', 'user', ?, JSON_OBJECT('discord_id', ?, 'discord_username', ?))",
            [req.user.id, req.user.id, discordUser.id, discordUser.username]
        );

        // Bot triggern: Rolle vergeben (asynchron, kein Await damit Response schnell kommt)
        const discordService = require('../services/discord');
        discordService.assignRoleIfEligible(req.user.id, discordUser.id).catch(console.error);

        // Redirect zum Account-Dashboard
        const accountsUrl = process.env.ACCOUNTS_URL || 'http://localhost';
        res.redirect(`${accountsUrl}/index.html?discord=linked`);
    } catch (err) {
        next(err);
    }
});

// ── DELETE /api/account/me ────────────────────────────────────
// DSGVO Art. 17: Recht auf Löschung
router.delete('/me', requireAuth, async (req, res, next) => {
    try {
        const discordService = require('../services/discord');
        // Discord Rolle entfernen falls vorhanden
        if (req.user.is_discord_linked && req.user.discord_id) {
            discordService.removeRole(req.user.discord_id).catch(console.error);
        }

        await pool.execute('DELETE FROM users WHERE id = ?', [req.user.id]);
        res.clearCookie('auth_token');
        res.json({ message: 'Account wurde gelöscht.' });
    } catch (err) {
        next(err);
    }
});

module.exports = router;
