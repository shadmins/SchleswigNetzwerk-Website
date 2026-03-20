'use strict';

const pool = require('../db/pool');

const DISCORD_API = 'https://discord.com/api/v10';
const GUILD_ID = process.env.DISCORD_GUILD_ID;
const ADMIN_ROLE_IDS = process.env.DISCORD_ADMIN_ROLES?.split(',') || [];
const EDITOR_ROLE_IDS = process.env.DISCORD_EDITOR_ROLES?.split(',') || [];

/**
 * Prüft ob Benutzer auf dem Discord-Server ist
 */
async function isMemberOfGuild(discordId, accessToken) {
    try {
        const res = await fetch(
            `${DISCORD_API}/users/@me/guilds`,
            { headers: { Authorization: `Bearer ${accessToken}` } }
        );
        
        if (!res.ok) return false;
        
        const guilds = await res.json();
        return guilds.some(g => g.id === GUILD_ID);
    } catch (err) {
        console.error('[Discord OAuth] isMemberOfGuild:', err.message);
        return false;
    }
}

/**
 * Holt Rollen des Benutzers auf dem Discord-Server
 */
async function getUserRoles(discordId) {
    try {
        const res = await fetch(
            `${DISCORD_API}/guilds/${GUILD_ID}/members/${discordId}`,
            { headers: { Authorization: `Bot ${process.env.DISCORD_BOT_TOKEN}` } }
        );
        
        if (!res.ok) return [];
        
        const member = await res.json();
        return member.roles || [];
    } catch (err) {
        console.error('[Discord OAuth] getUserRoles:', err.message);
        return [];
    }
}

/**
 * Prüft ob Benutzer Admin-Rollen hat
 */
function hasAdminRole(userRoles) {
    return userRoles.some(roleId => ADMIN_ROLE_IDS.includes(roleId));
}

/**
 * Prüft ob Benutzer Editor-Rollen hat
 */
function hasEditorRole(userRoles) {
    return userRoles.some(roleId => EDITOR_ROLE_IDS.includes(roleId));
}

/**
 * Erstellt oder aktualisiert Admin-User in DB
 */
async function createOrUpdateAdminUser(discordId, discordUsername, discordUser) {
    try {
        const [existing] = await pool.execute(
            'SELECT id FROM users WHERE discord_id = ?',
            [discordId]
        );

        if (existing.length > 0) {
            // Update bestehenden User
            await pool.execute(
                'UPDATE users SET discord_username = ?, updated_at = NOW() WHERE discord_id = ?',
                [discordUsername, discordId]
            );
            return existing[0];
        } else {
            // Neuen Admin-User erstellen
            const userId = require('uuid').v4();
            await pool.execute(
                `INSERT INTO users (id, email, discord_id, discord_username, role) 
                 VALUES (?, ?, ?, ?, 'admin')`,
                [userId, `${discordUsername}@discord.local`, discordId, discordUsername]
            );
            return { id: userId };
        }
    } catch (err) {
        console.error('[Discord OAuth] createOrUpdateAdminUser:', err.message);
        throw err;
    }
}

/**
 * Hauptfunktion: Validiert kompletten Discord Login
 */
async function validateDiscordLogin(discordId, discordUsername, accessToken) {
    try {
        // 1. Prüfe ob auf Guild
        const isMember = await isMemberOfGuild(discordId, accessToken);
        if (!isMember) {
            return { valid: false, error: 'Nicht auf Discord-Server' };
        }

        // 2. Hole Rollen
        const userRoles = await getUserRoles(discordId);

        // 3. Prüfe Rollen
        const isAdmin = hasAdminRole(userRoles);
        const isEditor = hasEditorRole(userRoles);

        if (!isAdmin && !isEditor) {
            return { valid: false, error: 'Keine Admin- oder Editor-Rolle' };
        }

        // 4. Erstelle/Update User
        const user = await createOrUpdateAdminUser(discordId, discordUsername);

        return {
            valid: true,
            userId: user.id,
            discordId,
            discordUsername,
            role: isAdmin ? 'admin' : 'editor',
            userRoles
        };
    } catch (err) {
        console.error('[Discord OAuth] validateDiscordLogin:', err.message);
        return { valid: false, error: 'Fehler bei Validierung' };
    }
}

module.exports = {
    isMemberOfGuild,
    getUserRoles,
    hasAdminRole,
    hasEditorRole,
    createOrUpdateAdminUser,
    validateDiscordLogin
};
