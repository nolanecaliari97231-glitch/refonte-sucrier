$files = @(
    @{ Local = "backoffice\guide.php"; Remote = "/backoffice/guide.php" }
)
$scriptDir = $PSScriptRoot
foreach ($f in $files) {
    & (Join-Path $scriptDir "ftp-upload-file.ps1") -LocalRelative $f.Local -RemotePath $f.Remote
}
