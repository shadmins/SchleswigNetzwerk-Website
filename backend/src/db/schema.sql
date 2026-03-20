-- ============================================================
-- Schleswig-Netzwerk Hardcore-API – Datenbank Schema
-- Kompatibel mit MySQL 8 / MariaDB 10.5+
-- XAMPP Local: Datenbank anlegen und dieses Script einspielen
-- Befehl: mysql -u root -p schleswig_netzwerk < schema.sql
-- ============================================================

CREATE DATABASE IF NOT EXISTS `schleswig_netzwerk`
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE `schleswig_netzwerk`;

-- ============================================================
-- Tabelle: users
-- Speichert alle registrierten Spieler-Accounts
-- ============================================================
CREATE TABLE IF NOT EXISTS `users` (
  `id`                    INT             UNSIGNED NOT NULL AUTO_INCREMENT,
  `email`                 VARCHAR(255)    NOT NULL,
  `password_hash`         VARCHAR(255)    NOT NULL COMMENT 'bcrypt/argon2 Hash – niemals Klartext',
  `nickname`              VARCHAR(64)     NOT NULL COMMENT 'Ingame Spieler-Nickname',
  `real_name`             VARCHAR(128)    NOT NULL COMMENT 'Echter Name (DSGVO: verschlüsselt empfohlen)',
  `discord_id`            VARCHAR(32)     DEFAULT NULL COMMENT 'Discord User-ID (Snowflake)',
  `discord_username`      VARCHAR(64)     DEFAULT NULL,
  `authentik_id`          VARCHAR(255)    DEFAULT NULL COMMENT 'Authentik User-ID (SSO)',
  `is_email_verified`     TINYINT(1)      NOT NULL DEFAULT 0,
  `is_discord_linked`     TINYINT(1)      NOT NULL DEFAULT 0,
  `is_discord_role_given` TINYINT(1)      NOT NULL DEFAULT 0,
  `verification_token`    VARCHAR(128)    DEFAULT NULL COMMENT 'E-Mail Verifizierungs-Token',
  `verification_expires`  DATETIME        DEFAULT NULL,
  `role`                  ENUM('user','moderator','admin') NOT NULL DEFAULT 'user',
  `is_active`             TINYINT(1)      NOT NULL DEFAULT 1,
  `created_at`            DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`            DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_email`       (`email`),
  UNIQUE KEY `uq_nickname`    (`nickname`),
  UNIQUE KEY `uq_discord_id`  (`discord_id`),
  UNIQUE KEY `uq_authentik_id` (`authentik_id`),
  INDEX `idx_verification_token` (`verification_token`),
  INDEX `idx_is_active`          (`is_active`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Registrierte Spieler-Accounts';

-- ============================================================
-- Tabelle: password_resets
-- Tokens für Passwort-Zurücksetzen (zeitlich begrenzt)
-- ============================================================
CREATE TABLE IF NOT EXISTS `password_resets` (
  `id`          INT         UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_id`     INT         UNSIGNED NOT NULL,
  `token_hash`  VARCHAR(128) NOT NULL COMMENT 'SHA-256 Hash des Reset-Tokens',
  `expires_at`  DATETIME    NOT NULL,
  `used_at`     DATETIME    DEFAULT NULL COMMENT 'NULL = noch nicht verwendet',
  `created_at`  DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `idx_token_hash` (`token_hash`),
  INDEX `idx_user_id`    (`user_id`),
  CONSTRAINT `fk_pr_user` FOREIGN KEY (`user_id`)
    REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Passwort-Reset Tokens';

-- ============================================================
-- Tabelle: sessions
-- Serverseitige JWT-Blacklist / aktive Sessions
-- ============================================================
CREATE TABLE IF NOT EXISTS `sessions` (
  `id`          INT         UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_id`     INT         UNSIGNED NOT NULL,
  `token_hash`  VARCHAR(128) NOT NULL COMMENT 'SHA-256 Hash des JWT',
  `ip_address`  VARCHAR(45) DEFAULT NULL,
  `user_agent`  VARCHAR(512) DEFAULT NULL,
  `expires_at`  DATETIME    NOT NULL,
  `created_at`  DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_token_hash` (`token_hash`),
  INDEX `idx_user_id`    (`user_id`),
  INDEX `idx_expires_at` (`expires_at`),
  CONSTRAINT `fk_sess_user` FOREIGN KEY (`user_id`)
    REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Aktive User-Sessions';

-- ============================================================
-- Tabelle: content_pages
-- CMS: Editierbare Seiteninhalte (Inline-Editor)
-- ============================================================
CREATE TABLE IF NOT EXISTS `content_pages` (
  `id`          INT         UNSIGNED NOT NULL AUTO_INCREMENT,
  `page_slug`   VARCHAR(64) NOT NULL COMMENT 'z.B. home, features, team',
  `section_key` VARCHAR(64) NOT NULL COMMENT 'z.B. hero_title, hero_text',
  `content`     LONGTEXT    DEFAULT NULL COMMENT 'HTML oder Plain Text',
  `content_type` ENUM('html','text','markdown') NOT NULL DEFAULT 'html',
  `updated_by`  INT         UNSIGNED DEFAULT NULL COMMENT 'User-ID des Editors',
  `updated_at`  DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_page_section` (`page_slug`, `section_key`),
  INDEX `idx_page_slug` (`page_slug`),
  CONSTRAINT `fk_cp_user` FOREIGN KEY (`updated_by`)
    REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Editierbare CMS Seiteninhalte';

-- ============================================================
-- Tabelle: admin_logs
-- Audit-Trail: Alle relevanten Admin-Aktionen
-- ============================================================
CREATE TABLE IF NOT EXISTS `admin_logs` (
  `id`          INT         UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_id`     INT         UNSIGNED DEFAULT NULL COMMENT 'Auslösender User (NULL = System)',
  `action`      VARCHAR(128) NOT NULL COMMENT 'z.B. user.register, user.verify, content.update',
  `target_type` VARCHAR(64) DEFAULT NULL COMMENT 'z.B. user, content',
  `target_id`   INT         UNSIGNED DEFAULT NULL,
  `details`     JSON        DEFAULT NULL COMMENT 'Zusätzliche Infos als JSON',
  `ip_address`  VARCHAR(45) DEFAULT NULL,
  `created_at`  DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `idx_user_id`   (`user_id`),
  INDEX `idx_action`    (`action`),
  INDEX `idx_created_at` (`created_at`),
  CONSTRAINT `fk_al_user` FOREIGN KEY (`user_id`)
    REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Admin Audit-Log';

-- ============================================================
-- Tabelle: news_posts
-- News / Ankündigungen (CMS)
-- ============================================================
CREATE TABLE IF NOT EXISTS `news_posts` (
  `id`          INT         UNSIGNED NOT NULL AUTO_INCREMENT,
  `title`       VARCHAR(256) NOT NULL,
  `slug`        VARCHAR(256) NOT NULL,
  `excerpt`     TEXT        DEFAULT NULL,
  `content`     LONGTEXT    DEFAULT NULL,
  `author_id`   INT         UNSIGNED DEFAULT NULL,
  `is_published` TINYINT(1) NOT NULL DEFAULT 0,
  `published_at` DATETIME   DEFAULT NULL,
  `created_at`  DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`  DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_slug` (`slug`),
  INDEX `idx_is_published` (`is_published`),
  INDEX `idx_published_at` (`published_at`),
  CONSTRAINT `fk_np_author` FOREIGN KEY (`author_id`)
    REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='News und Ankündigungen';

-- ============================================================
-- Tabelle: team_members
-- Team-Übersicht (editierbar per Admin)
-- ============================================================
CREATE TABLE IF NOT EXISTS `team_members` (
  `id`          INT         UNSIGNED NOT NULL AUTO_INCREMENT,
  `name`        VARCHAR(128) NOT NULL,
  `role_title`  VARCHAR(128) NOT NULL COMMENT 'z.B. Server-Entwickler, Event-Manager',
  `description` TEXT        DEFAULT NULL,
  `discord_tag` VARCHAR(64) DEFAULT NULL,
  `avatar_url`  VARCHAR(512) DEFAULT NULL,
  `sort_order`  INT         NOT NULL DEFAULT 0,
  `is_visible`  TINYINT(1)  NOT NULL DEFAULT 1,
  `created_at`  DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `idx_sort_order` (`sort_order`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Team-Mitglieder';

-- ============================================================
-- Tabelle: partners
-- Partner-Darstellung
-- ============================================================
CREATE TABLE IF NOT EXISTS `partners` (
  `id`          INT         UNSIGNED NOT NULL AUTO_INCREMENT,
  `name`        VARCHAR(128) NOT NULL,
  `description` TEXT        DEFAULT NULL,
  `logo_url`    VARCHAR(512) DEFAULT NULL,
  `website_url` VARCHAR(512) DEFAULT NULL,
  `sort_order`  INT         NOT NULL DEFAULT 0,
  `is_visible`  TINYINT(1)  NOT NULL DEFAULT 1,
  `created_at`  DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `idx_sort_order` (`sort_order`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Partner';

-- ============================================================
-- Beispiel-Standarddaten (Seed)
-- ============================================================
INSERT IGNORE INTO `content_pages` (`page_slug`, `section_key`, `content`, `content_type`) VALUES
  ('home', 'hero_title',    'Schleswig-Netzwerk', 'text'),
  ('home', 'hero_subtitle', 'GTA 5 Hardcore Roleplay Server', 'text'),
  ('home', 'hero_cta',      'Jetzt auf Discord beitreten', 'text'),
  ('home', 'about_text',    'Willkommen auf dem Schleswig-Netzwerk – dem härtesten GTA 5 Roleplay-Server in der DACH-Region.', 'html'),
  ('features', 'section_title', 'Server Features', 'text'),
  ('team', 'section_title',    'Unser Team', 'text'),
  ('partner', 'section_title', 'Unsere Partner', 'text'),
  ('dev-status', 'section_title', 'Development Status', 'text');
