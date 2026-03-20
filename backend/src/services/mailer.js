'use strict';

const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'localhost',
    port: parseInt(process.env.SMTP_PORT || '587', 10),
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
    },
});

const FROM = process.env.MAIL_FROM || '"Schleswig-Netzwerk" <system@schleswignetzwerk.eu>';
const APP_URL = process.env.APP_URL || 'http://localhost:3000';

// ── HTML Mail Template ────────────────────────────────────────
function mailTemplate(title, bodyHtml) {
    return `<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: 'Segoe UI', Arial, sans-serif; background: #0a0a0a; color: #f5f5f5; margin: 0; padding: 0; }
    .wrap { max-width: 600px; margin: 40px auto; background: #141414; border: 1px solid #e03030; border-radius: 8px; overflow: hidden; }
    .header { background: #e03030; padding: 28px 32px; text-align: center; }
    .header h1 { margin: 0; font-size: 22px; color: #fff; letter-spacing: 2px; text-transform: uppercase; }
    .body { padding: 32px; }
    .body p { line-height: 1.7; color: #ccc; }
    .btn { display: inline-block; margin: 24px 0; padding: 14px 32px; background: #e03030;
           color: #fff; text-decoration: none; border-radius: 4px; font-weight: bold; letter-spacing: 1px; }
    .footer { padding: 20px 32px; border-top: 1px solid #222; font-size: 12px; color: #555; }
    .footer a { color: #e03030; }
  </style>
</head>
<body>
  <div class="wrap">
    <div class="header"><h1>Schleswig-Netzwerk</h1></div>
    <div class="body">
      <h2 style="color:#e03030;margin-top:0">${title}</h2>
      ${bodyHtml}
    </div>
    <div class="footer">
      <p>Diese E-Mail wurde automatisch generiert – bitte nicht antworten.<br>
      <a href="${APP_URL}/impressum.html">Impressum</a> · <a href="${APP_URL}/datenschutz.html">Datenschutz</a></p>
    </div>
  </div>
</body>
</html>`;
}

// ── E-Mail Verifizierung ──────────────────────────────────────
async function sendVerificationMail(email, nickname, token) {
    const link = `${process.env.ACCOUNTS_URL || APP_URL}/verify.html?token=${token}`;
    const html = mailTemplate('E-Mail bestätigen', `
    <p>Hallo <strong>${nickname}</strong>,</p>
    <p>Willkommen auf dem <strong>Schleswig-Netzwerk</strong>! Bitte bestätige deine E-Mail-Adresse
       durch Klick auf den folgenden Button. Der Link ist <strong>24 Stunden</strong> gültig.</p>
    <a class="btn" href="${link}">E-Mail bestätigen</a>
    <p>Falls du dich nicht registriert hast, ignoriere diese E-Mail.</p>
  `);

    await transporter.sendMail({
        from: FROM,
        to: email,
        subject: 'Schleswig-Netzwerk – E-Mail bestätigen',
        html,
    });
}

// ── Passwort-Reset ────────────────────────────────────────────
async function sendPasswordResetMail(email, nickname, token) {
    const link = `${process.env.ACCOUNTS_URL || APP_URL}/reset-password.html?token=${token}`;
    const html = mailTemplate('Passwort zurücksetzen', `
    <p>Hallo <strong>${nickname}</strong>,</p>
    <p>Du hast eine Passwort-Zurücksetzung angefordert. Klicke auf den Button, um ein neues
       Passwort zu vergeben. Der Link ist <strong>1 Stunde</strong> gültig.</p>
    <a class="btn" href="${link}">Passwort zurücksetzen</a>
    <p>Falls du diese Anfrage nicht gestellt hast, ignoriere diese E-Mail. Dein Passwort bleibt unverändert.</p>
  `);

    await transporter.sendMail({
        from: FROM,
        to: email,
        subject: 'Schleswig-Netzwerk – Passwort zurücksetzen',
        html,
    });
}

module.exports = { sendVerificationMail, sendPasswordResetMail };
