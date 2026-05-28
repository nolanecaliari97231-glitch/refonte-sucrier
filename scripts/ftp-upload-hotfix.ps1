$files = @(
    @{ Local = "checkout-success.html"; Remote = "/checkout-success.html" },
    @{ Local = "app.js"; Remote = "/app.js" },
    @{ Local = "style.css"; Remote = "/style.css" },
    @{ Local = "mobile-ux.css"; Remote = "/mobile-ux.css" },
    @{ Local = "index.html"; Remote = "/index.html" }
)
$scriptDir = $PSScriptRoot
foreach ($f in $files) {
    & (Join-Path $scriptDir "ftp-upload-file.ps1") -LocalRelative $f.Local -RemotePath $f.Remote
}
