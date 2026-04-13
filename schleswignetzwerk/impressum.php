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
        
        <h2>Cookies</h2>
        <p>Unsere Website verwendet Cookies, um die Nutzererfahrung zu verbessern. Cookies sind kleine Textdateien, die auf Ihrem Endgerät gespeichert werden.</p>
        
        <h3>Arten von Cookies, die wir verwenden:</h3>
        <p><strong>Notwendige Cookies:</strong> Diese Cookies sind für die grundlegende Funktionalität der Website erforderlich. Sie können nicht deaktiviert werden.</p>
        <p><strong>Funktionale Cookies:</strong> Diese Cookies ermöglichen erweiterte Funktionalitäten wie die Speicherung Ihrer Cookie-Einstellungen.</p>
        <p><strong>Analyse-Cookies:</strong> Diese Cookies helfen uns zu verstehen, wie Besucher mit unserer Website interagieren.</p>
        
        <h3>Cookie-Verwaltung</h3>
        <p>Sie können Ihre Cookie-Einstellungen jederzeit in Ihrem Browser ändern oder Cookies ablehnen. Bitte beachten Sie, dass das Ablehnen von Cookies die Nutzung unserer Website einschränken kann.</p>
        
        <p><strong>Stand:</strong> April 2026</p>
    </section>

    <footer class="footer">
        <p>&copy; 2026 SchleswigNetzwerk. Alle Rechte vorbehalten.</p>
    </footer>

    <script src="script.js"></script>

    <?php include 'cookie-banner.php'; ?>

</body>
</html>
