-- ============================================================
-- Schleswig-Netzwerk CMS & Admin System
-- Neue Tabellen für Content Management
-- ============================================================

-- ── news: Nachrichten/Blog ────────────────────────────────────
CREATE TABLE IF NOT EXISTS `news` (
  `id`          VARCHAR(36)     NOT NULL PRIMARY KEY,
  `title`       VARCHAR(200)    NOT NULL,
  `content`     LONGTEXT        NOT NULL,
  `author`      VARCHAR(255)    NOT NULL,
  `published`   TINYINT(1)      DEFAULT 1,
  `created_at`  DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`  DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_published` (`published`),
  INDEX `idx_created_at` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Nachrichten/News für die Webseite';

-- ── team_members: Team Members auf der Website ─────────────────
CREATE TABLE IF NOT EXISTS `team_members` (
  `id`          VARCHAR(36)     NOT NULL PRIMARY KEY,
  `name`        VARCHAR(128)    NOT NULL,
  `role`        VARCHAR(64)     NOT NULL COMMENT 'z.B. Owner, Admin, Moderator',
  `avatar_url`  VARCHAR(512)    DEFAULT NULL,
  `bio`         TEXT            DEFAULT NULL,
  `position`    INT             DEFAULT 0 COMMENT 'Sortierposition',
  `active`      TINYINT(1)      DEFAULT 1,
  `created_at`  DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`  DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_position` (`position`),
  INDEX `idx_active` (`active`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Team-Mitglieder der Website';

-- ── server_config: Konfigurationen ──────────────────────────
CREATE TABLE IF NOT EXISTS `server_config` (
  `id`          INT             UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `section`     VARCHAR(64)     NOT NULL COMMENT 'z.B. server_info, features',
  `key`         VARCHAR(128)    NOT NULL,
  `value`       LONGTEXT        DEFAULT NULL,
  `updated_at`  DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY `uq_section_key` (`section`, `key`),
  INDEX `idx_section` (`section`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Dynamische Konfiguration und Inhalte';

-- ── gallery: Galerie Bilder ────────────────────────────────────
CREATE TABLE IF NOT EXISTS `gallery` (
  `id`          VARCHAR(36)     NOT NULL PRIMARY KEY,
  `title`       VARCHAR(255)    NOT NULL,
  `image_url`   VARCHAR(512)    NOT NULL,
  `description` TEXT            DEFAULT NULL,
  `category`    VARCHAR(64)     DEFAULT 'general',
  `position`    INT             DEFAULT 0,
  `uploaded_by` INT             UNSIGNED DEFAULT NULL,
  `created_at`  DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`  DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_category` (`category`),
  INDEX `idx_position` (`position`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Website Galerie Bilder';

-- ── Beispiel Daten ──────────────────────────────────────────────
INSERT IGNORE INTO `server_config` (`section`, `key`, `value`) VALUES
('server_info', 'description', 'Der härteste GTA 5 Hardcore RP Server'),
('server_info', 'rules', '1. Keine Hacks\n2. Roleplay nur im RP-Chat\n3. Respekt vor Admins'),
('server_info', 'events', 'Freitagabend: Community Event um 20 Uhr');
