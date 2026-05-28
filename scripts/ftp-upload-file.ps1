param(
    [Parameter(Mandatory = $true)][string]$LocalRelative,
    [Parameter(Mandatory = $true)][string]$RemotePath
)

$root = Resolve-Path (Join-Path $PSScriptRoot "..")
$c = Get-Content (Join-Path $root "deploy\ftp.credentials.json") -Raw | ConvertFrom-Json
$local = Join-Path $root $LocalRelative
$bytes = [System.IO.File]::ReadAllBytes($local)
$uri = "ftp://$($c.host):$($c.port)$RemotePath"
$r = [System.Net.FtpWebRequest]::Create($uri)
$r.Method = [System.Net.WebRequestMethods+Ftp]::UploadFile
$r.Credentials = New-Object System.Net.NetworkCredential($c.user, $c.password)
$r.UseBinary = $true
$r.UsePassive = $true
$r.EnableSsl = [bool]$c.useSsl
$r.ContentLength = $bytes.Length
$s = $r.GetRequestStream()
$s.Write($bytes, 0, $bytes.Length)
$s.Close()
$r.GetResponse().Close()
Write-Host "Uploaded $LocalRelative -> $RemotePath"
