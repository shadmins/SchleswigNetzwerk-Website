'use strict';

const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const { body, validationResult } = require('express-validator');
const pool = require('../db/pool');
const mailer = require('../services/mailer');
const { registerLimiter, loginLimiter, passwordResetLimiter } = require('../middleware/rateLimit');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

// ── Helpers ───────────────────────────────────────────────────
function createAuthCookie(res, token) {
    res.cookie('auth_token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 Tage
    });
}

function clearAuthCookie(res) {
    res.clearCookie('auth_token', { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'strict' });
}

// ── POST /api/auth/register ───────────────────────────────────
router.post('/register',
    registerLimiter,
    [
        body('email').isEmail().normalizeEmail().withMessage('Ungültige E-Mail-Adresse'),
        body('password')
            .isLength({ min: 8 }).withMessage('Passwort muss mindestens 8 Zeichen haben')
            .matches(/[A-Z]/).withMessage('Passwort muss einen Großbuchstaben enthalten')
            .matches(/[0-9]/).withMessage('Passwort muss eine Zahl enthalten'),
        body('nickname')
            .trim().isLength({ min: 3, max: 32 }).withMessage('Nickname: 3–32 Zeichen')
            .matches(/^[a-zA-Z0-9_\-]+$/).withMessage('Nickname darf nur Buchstaben, Zahlen, _ und - enthalten'),
        body('real_name').trim().isLength({ min: 2, max: 128 }).withMessage('Echter Name erforderlich (2–128 Zeichen)'),
    ],
    async (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { email, password, nickname, real_name } = req.body;

        try {
            // Duplikat-Prüfung
            const [existing] = await pool.execute(
                'SELECT id FROM users WHERE email = ? OR nickname = ?',
                [email, nickname]
            );
            if (existing.length > 0) {
                return res.status(409).json({ error: 'E-Mail oder Nickname bereits vergeben' });
            }

            const password_hash = await bcrypt.hash(password, 12);
            const verification_token = uuidv4();
            const verification_expires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24h

            await pool.execute(
                `INSERT INTO users (email, password_hash, nickname, real_name, verification_token, verification_expires)
         VALUES (?, ?, ?, ?, ?, ?)`,
                [email, password_hash, nickname, real_name, verification_token, verification_expires]
            );

            // Verifizierungs-E-Mail absenden
            await mailer.sendVerificationMail(email, nickname, verification_token);

            // Admin-Log
            await pool.execute(
                "INSERT INTO admin_logs (action, target_type, details, ip_address) VALUES ('user.register', 'user', JSON_OBJECT('email', ?, 'nickname', ?), ?)",
                [email, nickname, req.ip]
            );

            res.status(201).json({
                message: 'Account erstellt. Bitte überprüfe deine E-Mails und bestätige deine Adresse.',
            });
        } catch (err) {
            next(err);
        }
    }
);

// ── GET /api/auth/verify-email?token=... ──────────────────────
router.get('/verify-email', async (req, res, next) => {
    const { token } = req.query;
    if (!token) return res.status(400).json({ error: 'Kein Token angegeben' });

    try {
        const [rows] = await pool.execute(
            'SELECT id, nickname FROM users WHERE verification_token = ? AND verification_expires > NOW() AND is_email_verified = 0',
            [token]
        );
        if (rows.length === 0) {
            return res.status(400).json({ error: 'Token ungültig oder abgelaufen' });
        }

        const user = rows[0];
        await pool.execute(
            'UPDATE users SET is_email_verified = 1, verification_token = NULL, verification_expires = NULL WHERE id = ?',
            [user.id]
        );

        await pool.execute(
            "INSERT INTO admin_logs (user_id, action, target_type, target_id) VALUES (?, 'user.verify_email', 'user', ?)",
            [user.id, user.id]
        );

        res.json({ message: 'E-Mail erfolgreich verifiziert! Du kannst dich jetzt einloggen.' });
    } catch (err) {
        next(err);
    }
});

// ── POST /api/auth/login ──────────────────────────────────────
router.post('/login',
    loginLimiter,
    [
        body('email').isEmail().normalizeEmail(),
        body('password').notEmpty(),
    ],
    async (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ error: 'E-Mail oder Passwort ungültig' });
        }

        const { email, password } = req.body;

        try {
            const [rows] = await pool.execute(
                'SELECT id, email, password_hash, nickname, role, is_email_verified, is_active FROM users WHERE email = ?',
                [email]
            );

            if (rows.length === 0) {
                return res.status(401).json({ error: 'E-Mail oder Passwort falsch' });
            }

            const user = rows[0];
            if (!user.is_active) {
                return res.status(401).json({ error: 'Account deaktiviert' });
            }

            const valid = await bcrypt.compare(password, user.password_hash);
            if (!valid) {
                return res.status(401).json({ error: 'E-Mail oder Passwort falsch' });
            }

            // JWT erstellen
            const token = jwt.sign(
                { sub: user.id, role: user.role },
                process.env.JWT_SECRET,
                { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
            );

            // Session in DB speichern
            const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
            await pool.execute(
                'INSERT INTO sessions (user_id, token_hash, ip_address, user_agent, expires_at) VALUES (?, SHA2(?, 256), ?, ?, ?)',
                [user.id, token, req.ip, req.get('User-Agent') || '', expiresAt]
            );

            createAuthCookie(res, token);

            res.json({
                message: 'Erfolgreich eingeloggt',
                user: {
                    id: user.id,
                    email: user.email,
                    nickname: user.nickname,
                    role: user.role,
                    is_email_verified: user.is_email_verified,
                },
            });
        } catch (err) {
            next(err);
        }
    }
);

// ── POST /api/auth/logout ─────────────────────────────────────
router.post('/logout', requireAuth, async (req, res, next) => {
    try {
        await pool.execute(
            'DELETE FROM sessions WHERE token_hash = SHA2(?, 256)',
            [req.token]
        );
        clearAuthCookie(res);
        res.json({ message: 'Erfolgreich ausgeloggt' });
    } catch (err) {
        next(err);
    }
});

// ── POST /api/auth/request-password-reset ────────────────────
router.post('/request-password-reset',
    passwordResetLimiter,
    [body('email').isEmail().normalizeEmail()],
    async (req, res, next) => {
        // Immer gleiche Antwort (kein User-Enumeration)
        const genericResp = { message: 'Wenn diese E-Mail registriert ist, erhältst du einen Reset-Link.' };

        const errors = validationResult(req);
        if (!errors.isEmpty()) return res.json(genericResp);

        try {
            const [rows] = await pool.execute(
                'SELECT id, nickname FROM users WHERE email = ? AND is_active = 1',
                [req.body.email]
            );
            if (rows.length === 0) return res.json(genericResp);

            const user = rows[0];
            const token = uuidv4();
            const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1h

            await pool.execute(
                'INSERT INTO password_resets (user_id, token_hash, expires_at) VALUES (?, SHA2(?, 256), ?)',
                [user.id, token, expiresAt]
            );

            await mailer.sendPasswordResetMail(req.body.email, user.nickname, token);
            res.json(genericResp);
        } catch (err) {
            next(err);
        }
    }
);

// ── POST /api/auth/reset-password ────────────────────────────
router.post('/reset-password',
    [
        body('token').notEmpty(),
        body('password')
            .isLength({ min: 8 })
            .matches(/[A-Z]/)
            .matches(/[0-9]/),
    ],
    async (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { token, password } = req.body;

        try {
            const [rows] = await pool.execute(
                'SELECT pr.id, pr.user_id FROM password_resets pr WHERE pr.token_hash = SHA2(?, 256) AND pr.expires_at > NOW() AND pr.used_at IS NULL',
                [token]
            );
            if (rows.length === 0) {
                return res.status(400).json({ error: 'Token ungültig oder abgelaufen' });
            }

            const reset = rows[0];
            const password_hash = await bcrypt.hash(password, 12);

            await pool.execute('UPDATE users SET password_hash = ? WHERE id = ?', [password_hash, reset.user_id]);
            await pool.execute('UPDATE password_resets SET used_at = NOW() WHERE id = ?', [reset.id]);
            // Alle Sessions des Users löschen (Sicherheitsmaßnahme)
            await pool.execute('DELETE FROM sessions WHERE user_id = ?', [reset.user_id]);

            res.json({ message: 'Passwort erfolgreich zurückgesetzt. Du kannst dich jetzt einloggen.' });
        } catch (err) {
            next(err);
        }
    }
);



module.exports = router;
