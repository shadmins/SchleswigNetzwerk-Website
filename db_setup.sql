-- Database setup for Flarum
-- Replace 'SICHERES_PASSWORT_HIER' with a strong password!

CREATE DATABASE IF NOT EXISTS flarum CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER IF NOT EXISTS 'flarum'@'localhost' IDENTIFIED BY 'SICHERES_PASSWORT_HIER';
GRANT ALL PRIVILEGES ON flarum.* TO 'flarum'@'localhost';
FLUSH PRIVILEGES;
