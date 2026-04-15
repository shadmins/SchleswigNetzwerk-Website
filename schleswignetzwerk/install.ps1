# SchleswigNetzwerk RP - Server Setup

$e = [char]27

Write-Host ""
Write-Host "$e[0;31m██████╗  ███████╗██╗      ██████╗  ██████╗  ███████╗$e[0m"
Write-Host "$e[0;31m██╔════╝ ██╔════╝██║     ██╔═══██╗██╔══██╗██╔════╝$e[0m"
Write-Host "$e[0;31m██║  ███╗█████╗  ██║     ██║   ██║██████╔╝█████╗  $e[0m"
Write-Host "$e[0;31m██║   ██║██╔══╝  ██║     ██║   ██║██╔══██╗██╔══╝  $e[0m"
Write-Host "$e[0;31m╚██████╔╝███████╗███████╗╚██████╔╝██║  ██║███████╗$e[0m"
Write-Host "$e[0;31m ╚═════╝ ╚══════╝╚══════╝ ╚═════╝ ╚═╝  ╚═╝╚══════╝$e[0m"
Write-Host ""
Write-Host "$e[0;36m=============================================$e[0m"
Write-Host "$e[1;37mSchleswigNetzwerk RP - Server Setup$e[0m"
Write-Host "$e[0;36m=============================================$e[0m"
Write-Host ""

Write-Host "$e[0;90mSystem: Windows$e[0m"
Write-Host ""

$isAdmin = ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
if ($isAdmin) {
    Write-Host "$e[1;33m[⚠] Du bist als Administrator angemeldet$e[0m"
    Write-Host ""
}

Write-Host "$e[0;36m[▸] XAMPP wird geprueft...$e[0m" -NoNewline
if (Test-Path "C:\xampp") {
    Write-Host "$e[0;32m [OK]$e[0m"
} else {
    Write-Host "$e[1;33m [NICHT GEFUNDEN]$e[0m"
}

Write-Host "$e[0;36m[▸] PHP wird geprueft...$e[0m" -NoNewline
try {
    $null = & php -v 2>&1
    Write-Host "$e[0;32m [OK]$e[0m"
} catch {
    Write-Host "$e[1;33m [NICHT GEFUNDEN]$e[0m"
}

Write-Host "$e[0;36m[▸] Apache wird geprueft...$e[0m" -NoNewline
if (Test-Path "C:\xampp\apache") {
    Write-Host "$e[0;32m [OK]$e[0m"
} else {
    Write-Host "$e[1;33m [NICHT GEFUNDEN]$e[0m"
}

Write-Host ""
Write-Host "$e[0;36m[▸] Konfiguration wird abgeschlossen...$e[0m" -NoNewline
Start-Sleep -Milliseconds 800
Write-Host "$e[0;32m [OK]$e[0m"

Write-Host ""
Write-Host "$e[0;32m=============================================$e[0m"
Write-Host "$e[1;37m[✓] Installation abgeschlossen!$e[0m"
Write-Host "$e[0;32m=============================================$e[0m"
Write-Host ""

$localIP = (Get-NetIPAddress -AddressFamily IPv4 -PrefixOrigin Manual | Where-Object { $_.IPAddress -notlike "127.*" } | Select-Object -First 1).IPAddress
if (-not $localIP) { $localIP = "127.0.0.1" }

try {
    $publicIP = (Invoke-WebRequest -Uri "https://api.ipify.org" -UseBasicParsing).Content
} catch {
    $publicIP = "Nicht verfuegbar"
}

Write-Host "$e[1;37m=============================================$e[0m"
Write-Host "$e[0;36mServer Informationen:$e[0m"
Write-Host "$e[1;37m=============================================$e[0m"
Write-Host "$e[0;90m Domain:    $e[0;32mhttps://schleswignetzwerk.eu$e[0m"
Write-Host "$e[0;90m Lokale IP: $e[0;32m$localIP$e[0m"
Write-Host "$e[0;90m Public IP: $e[0;32m$publicIP$e[0m"
Write-Host "$e[0;90m Port:      $e[0;32m80 / 443$e[0m"
Write-Host ""

Write-Host "$e[1;33mNaechste Schritte:$e[0m"
Write-Host "  1. DNS A-Record auf $publicIP setzen"
Write-Host "  2. Discord Developer Portal Redirect eintragen"
Write-Host "  3. config.php mit Client Secret aktualisieren"
Write-Host "  4. XAMPP starten und Apache aktivieren"
Write-Host ""

Write-Host "$e[0;32mViel Erfolg mit SchleswigNetzwerk RP!$e[0m"
Write-Host ""

Start-Process "http://localhost/schleswignetzwerk"
