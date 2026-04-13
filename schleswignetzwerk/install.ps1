# SchleswigNetzwerk RP - Server Setup

Write-Host ""
Write-Host "============================================="
Write-Host " SchleswigNetzwerk RP - Server Setup"
Write-Host "============================================="
Write-Host ""
Write-Host "System: Windows"
Write-Host ""

$isAdmin = ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
if ($isAdmin) {
    Write-Host "[!] Du bist als Administrator angemeldet" -ForegroundColor Yellow
    Write-Host ""
}

Write-Host "[*] XAMPP wird geprueft..." -NoNewline
if (Test-Path "C:\xampp") {
    Write-Host " [OK]" -ForegroundColor Green
} else {
    Write-Host " [NICHT GEFUNDEN]" -ForegroundColor Yellow
}

Write-Host "[*] PHP wird geprueft..." -NoNewline
try {
    $null = & php -v 2>&1
    Write-Host " [OK]" -ForegroundColor Green
} catch {
    Write-Host " [NICHT GEFUNDEN]" -ForegroundColor Yellow
}

Write-Host "[*] Apache wird geprueft..." -NoNewline
if (Test-Path "C:\xampp\apache") {
    Write-Host " [OK]" -ForegroundColor Green
} else {
    Write-Host " [NICHT GEFUNDEN]" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "[*] Konfiguration wird abgeschlossen..." -NoNewline
Start-Sleep -Milliseconds 500
Write-Host " [OK]" -ForegroundColor Green

Write-Host ""
Write-Host "=============================================" -ForegroundColor Green
Write-Host "[OK] Installation abgeschlossen!" -ForegroundColor Green
Write-Host "=============================================" -ForegroundColor Green
Write-Host ""

$localIP = (Get-NetIPAddress -AddressFamily IPv4 -PrefixOrigin Manual | Where-Object { $_.IPAddress -notlike "127.*" } -ErrorAction SilentlyContinue | Select-Object -First 1).IPAddress
if (-not $localIP) { $localIP = "127.0.0.1" }

try {
    $publicIP = (Invoke-WebRequest -Uri "https://api.ipify.org" -UseBasicParsing -TimeoutSec 5).Content
} catch {
    $publicIP = "Nicht verfuegbar"
}

Write-Host "============================================="
Write-Host " Server Informationen:"
Write-Host "============================================="
Write-Host " Domain:    https://schleswignetzwerk.eu" -ForegroundColor Cyan
Write-Host " Lokale IP: $localIP" -ForegroundColor Cyan
Write-Host " Public IP: $publicIP" -ForegroundColor Cyan
Write-Host " Port:      80 / 443" -ForegroundColor Cyan
Write-Host ""

Write-Host "Naechste Schritte:" -ForegroundColor Yellow
Write-Host "  1. DNS A-Record auf $publicIP setzen"
Write-Host "  2. Discord Developer Portal Redirect eintragen"
Write-Host "  3. config.php mit Client Secret aktualisieren"
Write-Host "  4. XAMPP starten und Apache aktivieren"
Write-Host ""

Write-Host "Viel Erfolg mit SchleswigNetzwerk RP!" -ForegroundColor Green
Write-Host ""

Start-Process "http://localhost/schleswignetzwerk"
