'use strict';

const express = require('express');
const { body, validationResult } = require('express-validator');
const pool = require('../db/pool');
const { requireAuth, requireRole } = require('../middleware/auth');
const { requireAdmin, requireEditor } = require('../middleware/admin-auth');

const router = express.Router();

// Alle Routes benötigen Admin-Rolle
router.use(requireAuth, requireRole('admin'));

// ── GET /api/admin/users ──────────────────────────────────────
router.get('/users', async (req, res, next) => {
    try {
        const page = Math.max(1, parseInt(req.query.page || '1', 10));
        const limit = Math.min(100, parseInt(req.query.limit || '50', 10));
        const offset = (page - 1) * limit;

        const [users] = await pool.execute(
            `SELECT id, email, nickname, real_name, role, is_email_verified,
              is_discord_linked, is_discord_role_given, discord_username,
              is_active, created_at
       FROM users ORDER BY created_at DESC LIMIT ? OFFSET ?`,
            [limit, offset]
        );

        const [[{ total }]] = await pool.execute('SELECT COUNT(*) AS total FROM users');

        res.json({ users, total, page, limit });
    } catch (err) {
        next(err);
    }
});

// ── PATCH /api/admin/users/:id ────────────────────────────────
// Rolle ändern oder deaktivieren
router.patch('/users/:id', async (req, res, next) => {
    const { role, is_active } = req.body;
    const allowed_roles = ['user', 'moderator', 'admin'];

    if (role && !allowed_roles.includes(role)) {
        return res.status(400).json({ error: 'Ungültige Rolle' });
    }

    try {
        const updates = [];
        const values = [];
        if (role !== undefined) { updates.push('role = ?'); values.push(role); }
        if (is_active !== undefined) { updates.push('is_active = ?'); values.push(is_active ? 1 : 0); }

        if (updates.length === 0) return res.status(400).json({ error: 'Keine Änderungen angegeben' });

        values.push(req.params.id);
        await pool.execute(`UPDATE users SET ${updates.join(', ')} WHERE id = ?`, values);

        await pool.execute(
            "INSERT INTO admin_logs (user_id, action, target_type, target_id, details) VALUES (?, 'admin.user_update', 'user', ?, JSON_OBJECT('changes', ?))",
            [req.user.id, req.params.id, JSON.stringify(req.body)]
        );

        res.json({ message: 'Benutzer aktualisiert' });
    } catch (err) {
        next(err);
    }
});

// ── GET /api/admin/logs ───────────────────────────────────────
router.get('/logs', async (req, res, next) => {
    try {
        const page = Math.max(1, parseInt(req.query.page || '1', 10));
        const limit = Math.min(200, parseInt(req.query.limit || '100', 10));
        const offset = (page - 1) * limit;

        const [logs] = await pool.execute(
            `SELECT al.id, al.action, al.target_type, al.target_id, al.details,
              al.ip_address, al.created_at,
              u.nickname AS actor_nickname
       FROM admin_logs al
       LEFT JOIN users u ON al.user_id = u.id
       ORDER BY al.created_at DESC LIMIT ? OFFSET ?`,
            [limit, offset]
        );

        const [[{ total }]] = await pool.execute('SELECT COUNT(*) AS total FROM admin_logs');
        res.json({ logs, total, page, limit });
    } catch (err) {
        next(err);
    }
});

// ── GET /api/admin/stats ──────────────────────────────────────
router.get('/stats', async (req, res, next) => {
    try {
        const [[stats]] = await pool.execute(`
      SELECT
        COUNT(*) AS total_users,
        SUM(is_email_verified)    AS verified_users,
        SUM(is_discord_linked)    AS discord_linked,
        SUM(is_discord_role_given) AS roles_given,
        SUM(is_active = 0)        AS inactive_users
      FROM users
    `);
        res.json(stats);
    } catch (err) {
        next(err);
    }
});

// ── DASHBOARD (neue Editor Routes) ────────────────────────────
router.get('/dashboard', requireAuth, async (req, res, next) => {
    try {
        // Letzte News
        const [news] = await pool.execute(
            'SELECT id, title, updated_at FROM news ORDER BY updated_at DESC LIMIT 5'
        );

        // Letzte Änderungen
        const [logs] = await pool.execute(
            `SELECT action, target_type, created_at FROM admin_logs 
             ORDER BY created_at DESC LIMIT 10`
        );

        res.json({
            user: req.user,
            recentNews: news,
            recentChanges: logs
        });
    } catch (err) {
        next(err);
    }
});

// ── NEWS: Alle abrufen ───────────────────────────────────────
router.get('/news', requireAuth, async (req, res, next) => {
    try {
        const [news] = await pool.execute(
            'SELECT id, title, content, author, updated_at FROM news ORDER BY updated_at DESC'
        );
        res.json(news);
    } catch (err) {
        next(err);
    }
});

// ── NEWS: Eine abrufen ───────────────────────────────────────
router.get('/news/:id', requireAuth, async (req, res, next) => {
    try {
        const [news] = await pool.execute(
            'SELECT * FROM news WHERE id = ?',
            [req.params.id]
        );
        if (news.length === 0) return res.status(404).json({ error: 'News nicht gefunden' });
        res.json(news[0]);
    } catch (err) {
        next(err);
    }
});

// ── NEWS: Erstellen ──────────────────────────────────────────
router.post('/news',
    requireAuth,
    [
        body('title').isLength({ min: 3, max: 200 }),
        body('content').isLength({ min: 10 }),
    ],
    async (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

        try {
            const { title, content } = req.body;
            const id = require('uuid').v4();

            await pool.execute(
                'INSERT INTO news (id, title, content, author) VALUES (?, ?, ?, ?)',
                [id, title, content, req.user.discord_id || req.user.email]
            );

            res.status(201).json({ id, message: 'News erstellt' });
        } catch (err) {
            next(err);
        }
    }
);

// ── NEWS: Bearbeiten ─────────────────────────────────────────
router.put('/news/:id',
    requireAuth,
    [
        body('title').isLength({ min: 3, max: 200 }).optional(),
        body('content').isLength({ min: 10 }).optional(),
    ],
    async (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

        try {
            const { title, content } = req.body;

            await pool.execute(
                'UPDATE news SET title = ?, content = ? WHERE id = ?',
                [title, content, req.params.id]
            );

            res.json({ message: 'News aktualisiert' });
        } catch (err) {
            next(err);
        }
    }
);

// ── NEWS: Löschen ────────────────────────────────────────────
router.delete('/news/:id', requireRole('admin'), async (req, res, next) => {
    try {
        await pool.execute('DELETE FROM news WHERE id = ?', [req.params.id]);
        res.json({ message: 'News gelöscht' });
    } catch (err) {
        next(err);
    }
});

// ── SERVER-INFO: Abrufen ─────────────────────────────────────
router.get('/server-info', requireAuth, async (req, res, next) => {
    try {
        const [info] = await pool.execute(
            'SELECT key, value FROM server_config WHERE section = "server_info"'
        );
        const result = {};
        info.forEach(row => {
            result[row.key] = row.value;
        });
        res.json(result);
    } catch (err) {
        next(err);
    }
});

// ── SERVER-INFO: Aktualisieren ──────────────────────────────
router.put('/server-info', requireAuth, async (req, res, next) => {
    try {
        const { description, rules, events } = req.body;

        if (description) {
            await pool.execute(
                'REPLACE INTO server_config (section, key, value) VALUES ("server_info", "description", ?)',
                [description]
            );
        }
        if (rules) {
            await pool.execute(
                'REPLACE INTO server_config (section, key, value) VALUES ("server_info", "rules", ?)',
                [rules]
            );
        }
        if (events) {
            await pool.execute(
                'REPLACE INTO server_config (section, key, value) VALUES ("server_info", "events", ?)',
                [events]
            );
        }

        res.json({ message: 'Server-Informationen aktualisiert' });
    } catch (err) {
        next(err);
    }
});

// ── TEAM: Alle abrufen ───────────────────────────────────────
router.get('/team', requireAuth, async (req, res, next) => {
    try {
        const [team] = await pool.execute(
            'SELECT id, name, role, avatar_url, updated_at FROM team_members ORDER BY position ASC'
        );
        res.json(team);
    } catch (err) {
        next(err);
    }
});

// ── TEAM: Hinzufügen ─────────────────────────────────────────
router.post('/team',
    requireAuth,
    [
        body('name').isLength({ min: 3, max: 64 }),
        body('role').isLength({ min: 3, max: 64 }),
    ],
    async (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

        try {
            const { name, role, avatar_url, position = 0 } = req.body;
            const id = require('uuid').v4();

            await pool.execute(
                'INSERT INTO team_members (id, name, role, avatar_url, position) VALUES (?, ?, ?, ?, ?)',
                [id, name, role, avatar_url || '', position]
            );

            res.status(201).json({ id });
        } catch (err) {
            next(err);
        }
    }
);

// ── TEAM: Bearbeiten ─────────────────────────────────────────
router.put('/team/:id', requireAuth, async (req, res, next) => {
    try {
        const { name, role, avatar_url, position } = req.body;

        await pool.execute(
            'UPDATE team_members SET name = ?, role = ?, avatar_url = ?, position = ? WHERE id = ?',
            [name, role, avatar_url || '', position || 0, req.params.id]
        );

        res.json({ message: 'Teamseite aktualisiert' });
    } catch (err) {
        next(err);
    }
});

// ── TEAM: Löschen ────────────────────────────────────────────
router.delete('/team/:id', requireRole('admin'), async (req, res, next) => {
    try {
        await pool.execute('DELETE FROM team_members WHERE id = ?', [req.params.id]);
        res.json({ message: 'Teamseite gelöscht' });
    } catch (err) {
        next(err);
    }
});

module.exports = router;
