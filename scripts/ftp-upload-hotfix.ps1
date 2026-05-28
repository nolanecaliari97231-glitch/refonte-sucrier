$files = @(
    @{ Local = ".htaccess"; Remote = "/.htaccess" },
    @{ Local = "deploy\env.planethoster"; Remote = "/.env" },
    @{ Local = "includes\security.php"; Remote = "/includes/security.php" },
    @{ Local = "api\health.php"; Remote = "/api/health.php" },
    @{ Local = "backoffice\index.php"; Remote = "/backoffice/index.php" },
    @{ Local = "app.js"; Remote = "/app.js" }
)
$scriptDir = $PSScriptRoot
foreach ($f in $files) {
    & (Join-Path $scriptDir "ftp-upload-file.ps1") -LocalRelative $f.Local -RemotePath $f.Remote
}
