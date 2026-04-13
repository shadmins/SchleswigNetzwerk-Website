<?php
require_once 'config.php';

$loggedIn = isset($_SESSION['logged_in']) && $_SESSION['logged_in'] === true;
$username = $loggedIn ? ($_SESSION['username'] ?? 'User') : null;
?>
<!DOCTYPE html>
<html lang="de">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="description" content="SchleswigNetzwerk RP - Dein GTA 5 Roleplay Server. Erlebe realistisches RP mit Jobs, Fraktionen und einer lebendigen Community.">
    <meta name="keywords" content="GTA 5, Roleplay, RP Server, FiveM, Gaming, Community">
    <meta name="author" content="SchleswigNetzwerk">
    <title>Startseite - SchleswigNetzwerk RP</title>
    <link rel="stylesheet" href="styles.css">
</head>
<body>
    <nav class="navbar">
        <a href="/" class="logo"><img src="1.png" alt="SchleswigNetzwerk" height="35"></a>
        <ul class="nav-links">
            <li><a href="/">Startseite</a></li>
            <li><a href="/features">Features</a></li>
            <li><a href="/team">Team</a></li>
            <li><a href="/login">Login</a></li>
            <li><a href="/impressum">Impressum</a></li>
            <?php if ($loggedIn): ?>
                <li><a href="/logout" class="btn-discord-nav" style="background: var(--red);">Logout (<?= htmlspecialchars($username) ?>)</a></li>
            <?php else: ?>
                <li><a href="https://discord.gg/S567ad8B" class="btn-discord-nav" target="_blank">Discord beitreten</a></li>
            <?php endif; ?>
        </ul>
    </nav>

    <section class="hero">
        <div class="hero-content">
            <h1>Schleswig<span>Netzwerk</span> RP</h1>
            <p class="subtitle">Dein GTA 5 Roleplay Erlebnis beginnt hier</p>
            <div class="hero-buttons">
                <?php if ($loggedIn): ?>
                    <a href="#" class="btn btn-primary">Zum Server joinen</a>
                    <a href="/logout" class="btn btn-secondary">Logout</a>
                <?php else: ?>
                    <a href="/login" class="btn btn-primary">Per Discord anmelden</a>
                    <a href="https://discord.gg/S567ad8B" class="btn btn-secondary" target="_blank">Discord beitreten</a>
                <?php endif; ?>
            </div>
        </div>
    </section>

    <section class="intro">
        <h2>Willkommen bei SchleswigNetzwerk</h2>
        <p class="reveal">Erlebe eines der authentischsten Roleplay-Erlebnisse auf FiveM. Wir bieten eine lebendige Community, realistische Systeme und ein Team, das stets darauf bedacht ist, das beste Spielerlebnis zu liefern. Tauche ein in eine Welt voller Möglichkeiten – sei es als Unternehmer, Gesetzeshüter oder Gangster.</p>
    </section>

    <footer class="footer">
        <p>&copy; 2026 SchleswigNetzwerk. Alle Rechte vorbehalten.</p>
    </footer>

    <?php include 'cookie-banner.php'; ?>

    <script src="script.js"></script>
</body>
</html>
