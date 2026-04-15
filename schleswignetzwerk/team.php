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
    <meta name="description" content="SchleswigNetzwerk RP - Lernen Sie unser Team kennen">
    <meta name="keywords" content="GTA 5, Roleplay, Team, Server Team">
    <title>Team - SchleswigNetzwerk RP</title>
    <link rel="stylesheet" href="styles.css">
</head>
<body>
    <nav class="navbar">
        <a href="index.html" class="logo">SchleswigNetzwerk</a>
        <ul class="nav-links">
            <li><a href="index.html">Startseite</a></li>
            <li><a href="features.html">Features</a></li>
            <li><a href="team.html">Team</a></li>
            <li><a href="login.html">Login</a></li>
            <li><a href="impressum.html">Impressum</a></li>
            <?php if ($loggedIn): ?>
                <li><a href="logout.php" class="btn-discord-nav" style="background: var(--red);">Logout (<?= htmlspecialchars($username) ?>)</a></li>
            <?php else: ?>
                <li><a href="#" class="btn-discord-nav">Discord beitreten</a></li>
            <?php endif; ?>
        </ul>
    </nav>

    <header class="page-header">
        <h1>Unser <span>Team</span></h1>
    </header>

    <section class="team">
        <div class="team-grid">
            <div class="team-card reveal">
                <div class="team-image">👤</div>
                <div class="team-info">
                    <h3>Max Mustermann</h3>
                    <p class="role">Server Inhaber</p>
                    <p>Verantwortlich für die gesamte Serverstruktur und Community-Entwicklung.</p>
                </div>
            </div>

            <div class="team-card reveal">
                <div class="team-image">👤</div>
                <div class="team-info">
                    <h3>Anna Schmidt</h3>
                    <p class="role">Community Manager</p>
                    <p>Erste Ansprechpartnerin für Spieler und Organisatorin von Events.</p>
                </div>
            </div>

            <div class="team-card reveal">
                <div class="team-image">👤</div>
                <div class="team-info">
                    <h3>Lukas Weber</h3>
                    <p class="role">Head Developer</p>
                    <p>Entwickelt Custom Scripts und sorgt für stabile Serverperformance.</p>
                </div>
            </div>

            <div class="team-card reveal">
                <div class="team-image">👤</div>
                <div class="team-info">
                    <h3>Sarah Fischer</h3>
                    <p class="role">Event Manager</p>
                    <p>Plant und organisiert spannende Events für die Community.</p>
                </div>
            </div>

            <div class="team-card reveal">
                <div class="team-image">👤</div>
                <div class="team-info">
                    <h3>Tom Becker</h3>
                    <p class="role">Moderator</p>
                    <p>Sicherstellung eines fairen und respektvollen Spielumfelds.</p>
                </div>
            </div>

            <div class="team-card reveal">
                <div class="team-image">👤</div>
                <div class="team-info">
                    <h3>Julia Hoffmann</h3>
                    <p class="role">Supporter</p>
                    <p>Hilft Spielern bei Fragen und technischen Problemen.</p>
                </div>
            </div>
        </div>
    </section>

    <footer class="footer">
        <p>&copy; 2026 SchleswigNetzwerk. Alle Rechte vorbehalten.</p>
    </footer>

    <script src="script.js"></script>
</body>
</html>
