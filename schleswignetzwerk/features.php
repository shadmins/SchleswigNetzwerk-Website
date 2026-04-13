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
    <meta name="description" content="SchleswigNetzwerk RP - Features und Spielsysteme unseres GTA 5 Roleplay Servers">
    <meta name="keywords" content="GTA 5, Roleplay, Features, Jobs, Fraktionen, Wirtschaft">
    <title>Features - SchleswigNetzwerk RP</title>
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

    <header class="page-header">
        <h1>Server <span>Features</span></h1>
    </header>

    <section class="features">
        <div class="features-grid">
            <div class="feature-card reveal">
                <div class="feature-icon">🎭</div>
                <h3>Realistisches RP</h3>
                <p>Tauche ein in ein authentisches Roleplay-Erlebnis mit realistischen Interaktionen, Storylines und einem dynamischen Weltsystem.</p>
            </div>

            <div class="feature-card reveal">
                <div class="feature-icon">💼</div>
                <h3>Jobsystem</h3>
                <p>Wähle aus dozensen Berufen – vom Taxifahrer über Lastwagenfahrer bis zum Elektriker. Jeder Job bietet einzigartige Herausforderungen.</p>
            </div>

            <div class="feature-card reveal">
                <div class="feature-icon">🏢</div>
                <h3>Fraktionen</h3>
                <p>Schließe dich einer der vielen Fraktionen an – ob Polizei, Feuerwehr, Medien oder kriminelle Organisationen.</p>
            </div>

            <div class="feature-card reveal">
                <div class="feature-icon">💰</div>
                <h3>Wirtschaftssystem</h3>
                <p>Baue dein Imperium auf: kaufe Immobilien, gründe Unternehmen und handle mit anderen Spielern auf dem Marktplatz.</p>
            </div>

            <div class="feature-card reveal">
                <div class="feature-icon">⚙️</div>
                <h3>Custom Scripts</h3>
                <p>Unsere Entwickler haben individuelle Scripts programmiert, die ein einzigartiges Spielerlebnis garantieren.</p>
            </div>

            <div class="feature-card reveal">
                <div class="feature-icon">🎮</div>
                <h3>aktive Community</h3>
                <p>Regelmäßige Events, Turniere und Community-Aktionen sorgen für Unterhaltung rund um die Uhr.</p>
            </div>
        </div>
    </section>

    <footer class="footer">
        <p>&copy; 2026 SchleswigNetzwerk. Alle Rechte vorbehalten.</p>
    </footer>

    <?php include 'cookie-banner.php'; ?>

    <script src="script.js"></script>
</body>
</html>
