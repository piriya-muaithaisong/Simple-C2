// Silent launcher for Windows
// This creates an executable that launches the client without any visible window

const { spawn } = require('child_process');
const path = require('path');

// Path to the actual client executable
const clientPath = path.join(__dirname, 'dist', 'chat-client-silent.exe');

// Spawn the client process completely detached and hidden
const child = spawn(clientPath, [], {
  detached: true,
  stdio: 'ignore',
  windowsHide: true
});

// Unref so this launcher can exit immediately
child.unref();

// Exit the launcher immediately
process.exit(0);