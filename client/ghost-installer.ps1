# Ghost Installer - Completely invisible installation
$installerPath = Join-Path $PSScriptRoot "installer-lite.exe"
if (Test-Path $installerPath) {
    Start-Process $installerPath -WindowStyle Hidden -PassThru
}
exit