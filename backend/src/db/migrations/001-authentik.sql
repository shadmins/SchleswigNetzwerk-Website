-- ============================================================
-- Authentik Integration Migration
-- Version: 1.0
-- Description: Authentik OAuth2/SSO Support für Admin/Editor
-- ============================================================

-- Addiere Authentik-Spalten zur users Tabelle (falls nicht vorhanden)
ALTER TABLE users ADD COLUMN `authentik_id` VARCHAR(255) DEFAULT NULL UNIQUE COMMENT 'Authentik User-ID (SSO)' AFTER `discord_username`;

-- Index für schnelle Lookups
ALTER TABLE users ADD INDEX `idx_authentik_id` (`authentik_id`);

-- Hinweis: Diese Migration kann bedenkenlos mehrfach ausgeführt werden.
-- Die ALTER TABLE IF ... wird bei Bedarf angepasst.
