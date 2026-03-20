'use strict';

const express = require('express');
const xss = require('xss');
const pool = require('../db/pool');
const { requireAuth, requireRole } = require('../middleware/auth');

const router = express.Router();

// ── GET /api/content/:slug/:section ──────────────────────────
// Öffentlich: Inhalte abrufen
router.get('/:slug/:section', async (req, res, next) => {
    try {
        const [rows] = await pool.execute(
            'SELECT content, content_type, updated_at FROM content_pages WHERE page_slug = ? AND section_key = ?',
            [req.params.slug, req.params.section]
        );
        if (rows.length === 0) {
            return res.status(404).json({ error: 'Inhalt nicht gefunden' });
        }
        res.json(rows[0]);
    } catch (err) {
        next(err);
    }
});

// ── GET /api/content/:slug ────────────────────────────────────
// Alle Sections einer Seite
router.get('/:slug', async (req, res, next) => {
    try {
        const [rows] = await pool.execute(
            'SELECT section_key, content, content_type, updated_at FROM content_pages WHERE page_slug = ?',
            [req.params.slug]
        );
        const result = {};
        for (const row of rows) result[row.section_key] = row;
        res.json(result);
    } catch (err) {
        next(err);
    }
});

// ── PUT /api/content/:slug/:section ──────────────────────────
// Admin/Editor: Inhalt aktualisieren (SSO Auth required)
router.put('/:slug/:section',
    requireAuth,
    requireRole('admin', 'moderator'),
    async (req, res, next) => {
        const { content, content_type = 'html' } = req.body;
        if (typeof content === 'undefined') {
            return res.status(400).json({ error: 'Kein Inhalt angegeben' });
        }

        // XSS-Sanitierung
        const sanitized = content_type === 'html' ? xss(content) : content;

        try {
            await pool.execute(
                `INSERT INTO content_pages (page_slug, section_key, content, content_type, updated_by)
         VALUES (?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE content = VALUES(content), content_type = VALUES(content_type), updated_by = VALUES(updated_by)`,
                [req.params.slug, req.params.section, sanitized, content_type, req.user.id]
            );

            await pool.execute(
                "INSERT INTO admin_logs (user_id, action, target_type, details) VALUES (?, 'content.update', 'content', JSON_OBJECT('slug', ?, 'section', ?))",
                [req.user.id, req.params.slug, req.params.section]
            );

            res.json({ message: 'Inhalt gespeichert', content: sanitized });
        } catch (err) {
            next(err);
        }
    }
);

module.exports = router;
