'use strict';

/**
 * Cookie Consent Banner – DSGVO-konform
 * Kein Tracking ohne Zustimmung.
 */
document.addEventListener('DOMContentLoaded', () => {
    const STORAGE_KEY = 'sn_cookie_consent';
    const banner = document.getElementById('cookie-banner');
    if (!banner) return;

    const consent = localStorage.getItem(STORAGE_KEY);

    // Wenn noch keine Entscheidung getroffen
    if (!consent) {
        banner.classList.add('show');
    }

    // Akzeptieren
    const acceptBtn = document.getElementById('cookie-accept');
    if (acceptBtn) {
        acceptBtn.addEventListener('click', () => {
            localStorage.setItem(STORAGE_KEY, 'accepted');
            banner.classList.remove('show');
            // Optional: Analytics oder Discord-Embeds hier aktivieren
        });
    }

    // Ablehnen
    const declineBtn = document.getElementById('cookie-decline');
    if (declineBtn) {
        declineBtn.addEventListener('click', () => {
            localStorage.setItem(STORAGE_KEY, 'declined');
            banner.classList.remove('show');
        });
    }
});

/**
 * Prüft ob Cookies akzeptiert wurden.
 */
function hasConsent() {
    return localStorage.getItem('sn_cookie_consent') === 'accepted';
}
