'use strict';

const pool = require('../db/pool');

/*
 * Discord role management via REST API.
 * Der Bot muss NICHT laufen für diese Funktionen –
 * sie nutzen direkt die Discord REST API mit dem Bot-Token.
 */

const DISCORD_API = 'https://discord.com/api/v10';

function botHeaders() {
    return {
        Authorization: `Bot ${process.env.DISCORD_BOT_TOKEN}`,
        'Content-Type': 'application/json',
    };
}

/**
 * Prüft ob ein User auf dem Discord-Server ist.
 */
async function isOnGuild(discordId) {
    const res = await fetch(
        `${DISCORD_API}/guilds/${process.env.DISCORD_GUILD_ID}/members/${discordId}`,
        { headers: botHeaders() }
    );
    return res.ok;
}

/**
 * Vergibt die verifizierte Rolle an einen Discord-User.
 */
async function assignRole(discordId) {
    const guildId = process.env.DISCORD_GUILD_ID;
    const roleId = process.env.DISCORD_VERIFIED_ROLE_ID;
    if (!guildId || !roleId || !process.env.DISCORD_BOT_TOKEN) return false;

    const res = await fetch(
        `${DISCORD_API}/guilds/${guildId}/members/${discordId}/roles/${roleId}`,
        { method: 'PUT', headers: botHeaders() }
    );
    return res.ok || res.status === 204;
}

/**
 * Entfernt die verifizierte Rolle (z.B. bei Account-Löschung).
 */
async function removeRole(discordId) {
    const guildId = process.env.DISCORD_GUILD_ID;
    const roleId = process.env.DISCORD_VERIFIED_ROLE_ID;
    if (!guildId || !roleId || !process.env.DISCORD_BOT_TOKEN) return false;

    const res = await fetch(
        `${DISCORD_API}/guilds/${guildId}/members/${discordId}/roles/${roleId}`,
        { method: 'DELETE', headers: botHeaders() }
    );
    return res.ok || res.status === 204;
}

/**
 * Hauptfunktion: Rolle vergeben wenn alle Bedingungen erfüllt sind.
 * - E-Mail verifiziert
 * - Discord verknüpft
 * - User ist auf dem Discord-Server
 */
async function assignRoleIfEligible(userId, discordId) {
    try {
        const [rows] = await pool.execute(
            'SELECT is_email_verified, is_discord_linked FROM users WHERE id = ?',
            [userId]
        );
        if (rows.length === 0) return;

        const user = rows[0];
        if (!user.is_email_verified || !user.is_discord_linked) return;

        const onGuild = await isOnGuild(discordId);
        if (!onGuild) return;

        const success = await assignRole(discordId);
        if (success) {
            await pool.execute(
                'UPDATE users SET is_discord_role_given = 1 WHERE id = ?',
                [userId]
            );
            await pool.execute(
                "INSERT INTO admin_logs (user_id, action, target_type, target_id, details) VALUES (?, 'discord.role_assigned', 'user', ?, JSON_OBJECT('discord_id', ?))",
                [userId, userId, discordId]
            );
        }
    } catch (err) {
        console.error('[Discord Service] assignRoleIfEligible Fehler:', err.message);
    }
}

module.exports = { assignRole, removeRole, assignRoleIfEligible, isOnGuild };
