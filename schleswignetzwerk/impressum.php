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
    <meta name="description" content="SchleswigNetzwerk RP - Impressum">
    <meta name="keywords" content="Impressum, Kontakt, Rechtliches">
    <title>Impressum - SchleswigNetzwerk RP</title>
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

    <section class="impressum">
        <h1>Impressum</h1>
        
        <h2>Angaben gemäß § 5 TMG</h2>
        <p><strong>Name:</strong> [Name einfügen]</p>
        <p><strong>Adresse:</strong> [Adresse einfügen]</p>
        <p><strong>PLZ, Ort:</strong> [PLZ Ort einfügen]</p>
        
        <h2>Kontakt</h2>
        <p><strong>E-Mail:</strong> <a href="mailto:kontakt@schleswignetzwerk.eu">kontakt@schleswignetzwerk.eu</a></p>
        
        <h2>Haftungsausschluss</h2>
        <p>Die Inhalte dieser Website wurden mit größter Sorgfalt erstellt. Für die Richtigkeit, Vollständigkeit und Aktualität der Inhalte können wir jedoch keine Gewähr übernehmen.</p>
        
        <h2>Urheberrecht</h2>
        <p>Die durch die Seitenbetreiber erstellten Inhalte und Werke auf dieser Website unterliegen dem deutschen Urheberrecht. Beiträge Dritter sind als solche gekennzeichnet.</p>
        
        <h2>Datenschutz</h2>
        <p>Der Schutz Ihrer persönlichen Daten ist uns ein wichtiges Anliegen. Wir erheben, verarbeiten und nutzen Ihre Daten nur im Rahmen der gesetzlichen Bestimmungen.</p>
        
        <p><strong>Stand:</strong> April 2026</p>
    </section>

    <footer class="footer">
        <p>&copy; 2026 SchleswigNetzwerk. Alle Rechte vorbehalten.</p>
    </footer>

    <script src="script.js"></script>
</body>
</html>
