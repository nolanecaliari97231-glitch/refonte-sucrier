param([string]$Path = "/")

$root = Resolve-Path (Join-Path $PSScriptRoot "..")
$c = Get-Content (Join-Path $root "deploy\ftp.credentials.json") -Raw | ConvertFrom-Json
$uri = "ftp://$($c.host):$($c.port)$Path"
$r = [System.Net.FtpWebRequest]::Create($uri)
$r.Method = [System.Net.WebRequestMethods+Ftp]::ListDirectory
$r.Credentials = New-Object System.Net.NetworkCredential($c.user, $c.password)
$r.UsePassive = $true
$r.EnableSsl = [bool]$c.useSsl
$resp = $r.GetResponse()
$sr = New-Object IO.StreamReader($resp.GetResponseStream())
Write-Host "LIST $Path"
Write-Host $sr.ReadToEnd()
$resp.Close()
