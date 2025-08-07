# PowerShell script to run the client silently on Windows
# This runs the client without showing a console window

$scriptPath = Split-Path -Parent $MyInvocation.MyCommand.Path
$exePath = Join-Path $scriptPath "dist\chat-client-silent.exe"

# Check alternative path if not found
if (-not (Test-Path $exePath)) {
    $exePath = Join-Path $scriptPath "chat-client-silent.exe"
}

# Start the process hidden
$psi = New-Object System.Diagnostics.ProcessStartInfo
$psi.FileName = $exePath
$psi.WindowStyle = [System.Diagnostics.ProcessWindowStyle]::Hidden
$psi.CreateNoWindow = $true
$psi.UseShellExecute = $false

$process = [System.Diagnostics.Process]::Start($psi)

# Exit immediately - process continues in background
exit