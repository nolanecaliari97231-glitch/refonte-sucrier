# Déploie le site vers PlanetHoster (FTP) + env.planethoster → .env sur le serveur.
# Prérequis : deploy/ftp.credentials.json (copier depuis ftp.credentials.example.json)
# Usage :
#   powershell -ExecutionPolicy Bypass -File scripts/deploy-planethoster.ps1
#   powershell -ExecutionPolicy Bypass -File scripts/deploy-planethoster.ps1 -DryRun

param(
    [switch]$DryRun
)

$ErrorActionPreference = "Stop"
$root = Resolve-Path (Join-Path $PSScriptRoot "..")
$credsPath = Join-Path $root "deploy\ftp.credentials.json"
$envSource = Join-Path $root "deploy\env.planethoster"

if (-not (Test-Path $credsPath)) {
    Write-Error "Créez deploy/ftp.credentials.json (voir deploy/ftp.credentials.example.json)."
}
if (-not (Test-Path $envSource)) {
    Write-Error "Fichier deploy/env.planethoster introuvable."
}

$creds = Get-Content $credsPath -Raw | ConvertFrom-Json
$excludeDirs = @(
    ".git", "node_modules", "prototype_homepage", "dist_release", "scripts\audit-artifacts",
    ".idea", ".vscode", "secrets", "private"
)
$excludeFiles = @(
    ".env", "deploy\ftp.credentials.json", "deploy\env.planethoster", "data\auth.sqlite"
)

function Test-ExcludedPath([string]$relativePath) {
    $p = $relativePath -replace "\\", "/"
    foreach ($d in $excludeDirs) {
        $dNorm = ($d -replace "\\", "/").TrimEnd("/")
        if ($p -eq $dNorm -or $p.StartsWith("$dNorm/")) { return $true }
    }
    foreach ($f in $excludeFiles) {
        $fNorm = ($f -replace "\\", "/")
        if ($p -eq $fNorm) { return $true }
    }
    if ($p -match "(^|/)\.env(\.|$)" -and $p -ne "deploy/env.planethoster") { return $true }
    if ($p -match "\.md$" -and $p.StartsWith("docs/")) { return $false }
    return $false
}

function Get-AllFiles([string]$base) {
    Get-ChildItem -Path $base -Recurse -File -Force | ForEach-Object {
        $rel = $_.FullName.Substring($base.Length + 1)
        if (-not (Test-ExcludedPath $rel)) {
            [PSCustomObject]@{ Relative = $rel; Full = $_.FullName }
        }
    }
}

function New-FtpUri([string]$path) {
    $base = "ftp://{0}:{1}{2}" -f $creds.host, $creds.port, $path
    return $base
}

function Invoke-Ftp([string]$method, [string]$remotePath, [byte[]]$content = $null) {
    $uri = New-FtpUri $remotePath
    $request = [System.Net.FtpWebRequest]::Create($uri)
    $request.Method = $method
    $request.Credentials = New-Object System.Net.NetworkCredential($creds.user, $creds.password)
    $request.UseBinary = $true
    $request.UsePassive = $true
    $request.EnableSsl = [bool]$creds.useSsl
    if ($content -ne $null) {
        $request.ContentLength = $content.Length
        $stream = $request.GetRequestStream()
        $stream.Write($content, 0, $content.Length)
        $stream.Close()
    }
    $response = $request.GetResponse()
    $response.Close() | Out-Null
}

function Ensure-FtpDirectory([string]$remoteDir) {
    if ($remoteDir -eq "/" -or $remoteDir -eq "") { return }
    $parts = $remoteDir.Trim("/").Split("/")
    $current = ""
    foreach ($part in $parts) {
        $current += "/$part"
        try {
            Invoke-Ftp ([System.Net.WebRequestMethods+Ftp]::MakeDirectory) $current
        } catch {
            # existe déjà
        }
    }
}

$remoteRoot = if ($creds.remoteRoot) { $creds.remoteRoot.TrimEnd("/") } else { "" }
if ($remoteRoot -eq "") { $remoteRoot = "" }

Write-Host "PlanetHoster deploy → $($creds.host) (root: '$remoteRoot')"
$files = Get-AllFiles $root
Write-Host ("Fichiers à envoyer : {0}" -f ($files.Count + 1))

if ($DryRun) {
    $files | Select-Object -First 20 | ForEach-Object { Write-Host "  $($_.Relative)" }
    Write-Host "  ... + .env (depuis deploy/env.planethoster)"
    exit 0
}

try {
    Invoke-Ftp ([System.Net.WebRequestMethods+Ftp]::PrintWorkingDirectory) "/"
} catch {
    Write-Error "Connexion FTP impossible : $($_.Exception.Message)"
}

foreach ($file in $files) {
    $remotePath = "$remoteRoot/$($file.Relative -replace '\\', '/')"
    $remoteDir = Split-Path $remotePath -Parent
    Ensure-FtpDirectory ($remoteDir -replace '\\', '/')
    $bytes = [System.IO.File]::ReadAllBytes($file.Full)
    Invoke-Ftp ([System.Net.WebRequestMethods+Ftp]::UploadFile) $remotePath $bytes
    Write-Host "  OK $($file.Relative)"
}

$envBytes = [System.IO.File]::ReadAllBytes($envSource)
$envRemote = "$remoteRoot/.env"
Ensure-FtpDirectory (Split-Path $envRemote -Parent)
Invoke-Ftp ([System.Net.WebRequestMethods+Ftp]::UploadFile) $envRemote $envBytes
Write-Host "  OK .env (depuis deploy/env.planethoster)"

Write-Host "Déploiement terminé. Testez https://sucrier.sc1scrp972.universe.wf/ et configurez le hash admin (scripts/setup_admin_password.php sur le serveur)."
