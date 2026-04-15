<?php
require_once 'config.php';

$error = isset($_GET['error']) ? $_GET['error'] : null;
$errorDescription = isset($_GET['error_description']) ? $_GET['error_description'] : null;
$code = isset($_GET['code']) ? $_GET['code'] : null;
?>
<!DOCTYPE html>
<html lang="de">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="description" content="SchleswigNetzwerk RP - Login Callback">
    <title>Authentifizierung - SchleswigNetzwerk RP</title>
    <link rel="stylesheet" href="styles.css">
    <style>
        .callback-container {
            min-height: 80vh;
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            padding: 2rem;
            text-align: center;
        }
        .callback-status {
            font-size: 1.5rem;
            margin-bottom: 1rem;
        }
        .callback-message {
            color: var(--white-dim);
            max-width: 500px;
        }
        .spinner {
            width: 50px;
            height: 50px;
            border: 3px solid var(--gray);
            border-top: 3px solid var(--red);
            border-radius: 50%;
            animation: spin 1s linear infinite;
            margin-bottom: 2rem;
        }
        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
        .success { color: #00ff00; }
        .error { color: var(--red); }
    </style>
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
            <li><a href="#" class="btn-discord-nav">Discord beitreten</a></li>
        </ul>
    </nav>

    <section class="callback-container">
        <?php if ($error): ?>
            <p class="callback-status error">Fehler bei der Anmeldung</p>
            <p class="callback-message"><?= htmlspecialchars($errorDescription ?: 'Ein Fehler ist aufgetreten.') ?></p>
            <meta http-equiv="refresh" content="3;url=login.html">
        <?php elseif ($code): ?>
            <?php
            // OAuth Token anfordern
            $tokenData = [
                'client_id' => DISCORD_CLIENT_ID,
                'client_secret' => DISCORD_CLIENT_SECRET,
                'grant_type' => 'authorization_code',
                'code' => $code,
                'redirect_uri' => DISCORD_REDIRECT_URI
            ];

            $ch = curl_init('https://discord.com/api/oauth2/token');
            curl_setopt($ch, CURLOPT_POST, true);
            curl_setopt($ch, CURLOPT_POSTFIELDS, http_build_query($tokenData));
            curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
            curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/x-www-form-urlencoded']);
            
            $tokenResponse = curl_exec($ch);
            curl_close($ch);
            
            $token = json_decode($tokenResponse, true);

            if (isset($token['access_token'])) {
                // User-Daten abrufen
                $ch = curl_init('https://discord.com/api/users/@me');
                curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
                curl_setopt($ch, CURLOPT_HTTPHEADER, ['Authorization: Bearer ' . $token['access_token']]);
                $userResponse = curl_exec($ch);
                curl_close($ch);
                
                $user = json_decode($userResponse, true);

                if (isset($user['id'])) {
                    // Session speichern
                    $_SESSION['user_id'] = $user['id'];
                    $_SESSION['username'] = $user['username'];
                    $_SESSION['discriminator'] = $user['discriminator'];
                    $_SESSION['email'] = $user['email'] ?? '';
                    $_SESSION['avatar'] = $user['avatar'];
                    $_SESSION['logged_in'] = true;
                    
                    // User in Datenbank speichern (optional)
                    // saveUserToDatabase($user);
                    ?>
                    <p class="callback-status success">Anmeldung erfolgreich!</p>
                    <p class="callback-message">Willkommen zurück, <?= htmlspecialchars($user['username']) ?>!</p>
                    <meta http-equiv="refresh" content="2;url=index.html">
                    <?php
                } else {
                    echo '<p class="callback-status error">Fehler beim Abrufen der Benutzerdaten</p>';
                    echo '<meta http-equiv="refresh" content="3;url=login.html">';
                }
            } else {
                echo '<p class="callback-status error">Fehler bei der Authentifizierung</p>';
                echo '<meta http-equiv="refresh" content="3;url=login.html">';
            }
            ?>
        <?php else: ?>
            <p class="callback-status error">Ungültige Anfrage</p>
            <p class="callback-message">Du wurdest ohne gültigen Code weitergeleitet.</p>
            <meta http-equiv="refresh" content="3;url=login.html">
        <?php endif; ?>
    </section>

    <footer class="footer">
        <p>&copy; 2026 SchleswigNetzwerk. Alle Rechte vorbehalten.</p>
    </footer>
</body>
</html>
