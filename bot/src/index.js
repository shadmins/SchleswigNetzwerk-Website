'use strict';

require('dotenv').config({ path: '../backend/.env' });
const { Client, GatewayIntentBits, Events } = require('discord.js');
const mysql = require('mysql2/promise');

// ── Datenbank ─────────────────────────────────────────────────
const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '3306', 10),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASS || '',
    database: process.env.DB_NAME || 'schleswig_netzwerk',
    charset: 'utf8mb4',
});

// ── Discord Client ────────────────────────────────────────────
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
    ],
});

const GUILD_ID = process.env.DISCORD_GUILD_ID;
const VERIFIED_ROLE = process.env.DISCORD_VERIFIED_ROLE_ID;

// ── Bot Ready ─────────────────────────────────────────────────
client.once(Events.ClientReady, (c) => {
    console.log(`\n🤖 Discord Bot online als: ${c.user.tag}`);
    console.log(`   Guild: ${GUILD_ID}`);
    console.log(`   Verifizierte Rolle: ${VERIFIED_ROLE}\n`);
});

// ── Neues Mitglied tritt bei → Prüfung ───────────────────────
client.on(Events.GuildMemberAdd, async (member) => {
    if (member.guild.id !== GUILD_ID) return;

    try {
        const [rows] = await pool.execute(
            'SELECT id, is_email_verified, is_discord_linked FROM users WHERE discord_id = ?',
            [member.id]
        );

        if (rows.length === 0) return; // Nicht in DB

        const user = rows[0];
        if (user.is_email_verified && user.is_discord_linked) {
            await member.roles.add(VERIFIED_ROLE);
            await pool.execute(
                'UPDATE users SET is_discord_role_given = 1 WHERE id = ?',
                [user.id]
            );
            console.log(`✅ Rolle vergeben an: ${member.user.tag} (User ID: ${user.id})`);
        }
    } catch (err) {
        console.error(`❌ Fehler bei GuildMemberAdd für ${member.user.tag}:`, err.message);
    }
});

// ── Sync-Funktion: Alle User prüfen ──────────────────────────
async function syncAllRoles() {
    try {
        const guild = await client.guilds.fetch(GUILD_ID);
        const [users] = await pool.execute(
            'SELECT id, discord_id FROM users WHERE is_email_verified = 1 AND is_discord_linked = 1 AND is_discord_role_given = 0 AND discord_id IS NOT NULL'
        );

        let count = 0;
        for (const user of users) {
            try {
                const member = await guild.members.fetch(user.discord_id);
                if (member) {
                    await member.roles.add(VERIFIED_ROLE);
                    await pool.execute('UPDATE users SET is_discord_role_given = 1 WHERE id = ?', [user.id]);
                    count++;
                }
            } catch (e) {
                // User nicht auf dem Server oder anderer Fehler
            }
        }

        if (count > 0) console.log(`🔄 Sync: ${count} Rollen vergeben`);
    } catch (err) {
        console.error('❌ Sync-Fehler:', err.message);
    }
}

// ── Periodischer Sync (alle 5 Minuten) ───────────────────────
client.once(Events.ClientReady, () => {
    syncAllRoles();
    setInterval(syncAllRoles, 5 * 60 * 1000);
});

// ── Login ─────────────────────────────────────────────────────
const TOKEN = process.env.DISCORD_BOT_TOKEN;
if (!TOKEN) {
    console.error('❌ DISCORD_BOT_TOKEN fehlt in der .env');
    process.exit(1);
}

client.login(TOKEN);
