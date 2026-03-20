'use strict';

const mysql = require('mysql2/promise');

const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '3306', 10),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASS || '',
    database: process.env.DB_NAME || 'schleswig_netzwerk',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    charset: 'utf8mb4',
    timezone: '+00:00',
});

// Verbindungstest beim Start
pool.getConnection()
    .then(conn => {
        console.log('✅ MySQL Verbindung erfolgreich (XAMPP)');
        conn.release();
    })
    .catch(err => {
        console.error('❌ MySQL Verbindungsfehler:', err.message);
        console.error('   Stelle sicher, dass XAMPP MySQL läuft und die .env korrekt ist.');
    });

module.exports = pool;
