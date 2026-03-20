'use strict';

const rateLimit = require('express-rate-limit');

const windowMs15m = 15 * 60 * 1000;
const windowMs1h = 60 * 60 * 1000;

/** Registrierung: max. 5 Versuche pro Stunde */
const registerLimiter = rateLimit({
    windowMs: windowMs1h,
    max: 5,
    message: { error: 'Zu viele Registrierungsversuche. Bitte in 1 Stunde erneut versuchen.' },
    standardHeaders: true,
    legacyHeaders: false,
});

/** Login: max. 10 Versuche pro 15 Minuten */
const loginLimiter = rateLimit({
    windowMs: windowMs15m,
    max: 10,
    message: { error: 'Zu viele Login-Versuche. Bitte in 15 Minuten erneut versuchen.' },
    standardHeaders: true,
    legacyHeaders: false,
});

/** Passwort-Reset: max. 3 Anfragen pro Stunde */
const passwordResetLimiter = rateLimit({
    windowMs: windowMs1h,
    max: 3,
    message: { error: 'Zu viele Passwort-Reset-Anfragen. Bitte in 1 Stunde erneut versuchen.' },
    standardHeaders: true,
    legacyHeaders: false,
});

/** Allgemeines API-Limit */
const apiLimiter = rateLimit({
    windowMs: windowMs15m,
    max: 200,
    message: { error: 'Zu viele Anfragen. Bitte versuche es später erneut.' },
    standardHeaders: true,
    legacyHeaders: false,
});

module.exports = { registerLimiter, loginLimiter, passwordResetLimiter, apiLimiter };
