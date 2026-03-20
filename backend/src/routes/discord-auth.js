'use strict';

const express = require('express');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const pool = require('../db/pool');
const discordOAuth = require('../services/discord-oauth');
const router = express.Router();

// ── POST /api/auth/discord/login ─────────────────────────────
// Startet Discord OAuth2 Flow
router.post('/discord/login', (req, res) => {
    const state = uuidv4();
    
    // State in Session speichern (CSRF Schutz)
    res.cookie('discord_oauth_state', state, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 10 * 60 * 1000, // 10 Minuten
    });

    const clientId = process.env.DISCORD_CLIENT_ID;
    const redirectUri = `${process.env.APP_URL}/api/auth/discord/callback`;
    const scope = 'identify guilds';

    const authUrl = `https://discord.com/api/oauth2/authorize?` +
        `client_id=${clientId}&` +
        `redirect_uri=${encodeURIComponent(redirectUri)}&` +
        `response_type=code&` +
        `scope=${encodeURIComponent(scope)}&` +
        `state=${state}`;

    res.json({ redirect_url: authUrl });
});

// ── GET /api/auth/discord/callback ───────────────────────────
// Discord OAuth2 Callback
router.get('/discord/callback', async (req, res, next) => {
    try {
        const { code, state } = req.query;
        const savedState = req.cookies.discord_oauth_state;

        // State-Prüfung (CSRF)
        if (!state || !savedState || state !== savedState) {
            return res.redirect('/edit/login.html?error=csrf_failed');
        }

        // Code gegen Access Token tauschen
        const tokenRes = await fetch('https://discord.com/api/v10/oauth2/token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
                client_id: process.env.DISCORD_CLIENT_ID,
                client_secret: process.env.DISCORD_CLIENT_SECRET,
                code,
                grant_type: 'authorization_code',
                redirect_uri: `${process.env.APP_URL}/api/auth/discord/callback`,
            }),
        });

        if (!tokenRes.ok) {
            return res.redirect('/edit/login.html?error=token_exchange_failed');
        }

        const tokenData = await tokenRes.json();
        const accessToken = tokenData.access_token;

        // Benutzer-Daten abrufen
        const userRes = await fetch('https://discord.com/api/v10/users/@me', {
            headers: { Authorization: `Bearer ${accessToken}` },
        });

        if (!userRes.ok) {
            return res.redirect('/edit/login.html?error=user_fetch_failed');
        }

        const discordUser = await userRes.json();
        const { id: discordId, username: discordUsername } = discordUser;

        // Discord Login validieren (Rollen prüfen)
        const validation = await discordOAuth.validateDiscordLogin(
            discordId,
            discordUsername,
            accessToken
        );

        if (!validation.valid) {
            return res.redirect(`/edit/login.html?error=${encodeURIComponent(validation.error)}`);
        }

        // JWT Token erstellen
        const authToken = jwt.sign(
            { sub: validation.userId, role: validation.role, discord_id: discordId },
            process.env.JWT_SECRET || 'dev-secret',
            { expiresIn: '7d' }
        );

        // Session in DB speichern
        const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
        await pool.execute(
            'INSERT INTO sessions (user_id, token_hash, ip_address, user_agent, expires_at) VALUES (?, SHA2(?, 256), ?, ?, ?)',
            [validation.userId, authToken, req.ip, req.get('User-Agent') || '', expiresAt]
        );

        // Auth Cookie setzen
        res.cookie('auth_token', authToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 7 * 24 * 60 * 60 * 1000,
        });

        res.clearCookie('discord_oauth_state');

        // Redirect zum Admin Dashboard
        res.redirect(`/admin/dashboard?token=${authToken}`);
    } catch (err) {
        console.error('[Discord OAuth Callback]:', err.message);
        res.redirect('/edit/login.html?error=server_error');
    }
});

// ──  GET /api/auth/discord/user ──────────────────────────────
// Gibt aktuellen User zurück
router.get('/discord/user', async (req, res, next) => {
    try {
        const token = req.cookies.auth_token;
        if (!token) {
            return res.status(401).json({ error: 'Nicht authentifiziert' });
        }

        let decoded;
        try {
            decoded = jwt.verify(token, process.env.JWT_SECRET || 'dev-secret');
        } catch (err) {
            return res.status(401).json({ error: 'Token ungültig' });
        }

        const [users] = await pool.execute(
            'SELECT id, email, discord_id, discord_username, role FROM users WHERE id = ?',
            [decoded.sub]
        );

        if (users.length === 0) {
            return res.status(404).json({ error: 'User nicht gefunden' });
        }

        res.json(users[0]);
    } catch (err) {
        next(err);
    }
});

// ── POST /api/auth/discord/logout ────────────────────────────
// Logout
router.post('/discord/logout', async (req, res, next) => {
    try {
        const token = req.cookies.auth_token;
        if (token) {
            await pool.execute(
                'DELETE FROM sessions WHERE token_hash = SHA2(?, 256)',
                [token]
            );
        }
        
        res.clearCookie('auth_token');
        res.json({ message: 'Erfolgreich abgemeldet' });
    } catch (err) {
        next(err);
    }
});

module.exports = router;
