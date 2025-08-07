# Silent/Headless Client

The silent client runs in the background without any console window, making it ideal for persistent connections.

## Features

- **No Console Window** - Runs completely hidden
- **Auto-Reconnect** - Reconnects automatically if disconnected
- **Termination on Delete** - Exits when admin deletes the room
- **Silent Operation** - No output or user interaction

## Pre-built Executables

### Silent Executables (No Console)
- **Linux**: `./dist/chat-client-silent`
- **Windows**: `dist/chat-client-silent.exe`

### Regular Executables (With Console)
- **Linux**: `./dist/chat-client`
- **Windows**: `dist/chat-client.exe`

## Running Silent Client

### Linux/Mac
```bash
# Run in background
./dist/chat-client-silent &

# Or use nohup to persist after terminal closes
nohup ./dist/chat-client-silent > /dev/null 2>&1 &
```

### Windows

**Method 1: VBScript (Recommended)**
```cmd
# Double-click or run:
run-silent.vbs
```

**Method 2: PowerShell**
```powershell
# Run the PowerShell script:
powershell -ExecutionPolicy Bypass -File run-silent.ps1
```

**Method 3: Direct Execution**
```cmd
# Using start command:
start /B chat-client-silent.exe

# Or from Task Scheduler for startup
```

## Configuration

### Change Server URL

```bash
# Configure URL for both clients
./configure-silent.sh ws://your-server:8080

# Rebuild
npm run build:silent:all
```

## Building from Source

```bash
# Install dependencies
npm install

# Build silent clients
npm run build:silent        # Linux
npm run build:silent:win    # Windows
npm run build:silent:all    # All platforms

# Build regular clients
npm run build              # Linux
npm run build:win          # Windows
npm run build:all          # All platforms
```

## Auto-Start on Boot

### Windows
1. Press `Win + R`, type `shell:startup`
2. Copy `run-silent.vbs` to the startup folder

### Linux
Add to crontab:
```bash
@reboot /path/to/chat-client-silent
```

Or create systemd service:
```ini
[Unit]
Description=Chat Client
After=network.target

[Service]
Type=simple
ExecStart=/path/to/chat-client-silent
Restart=always

[Install]
WantedBy=multi-user.target
```

## Features

- **Automatic Termination**: Client exits when admin deletes the room
- **Silent Commands**: Executes commands without showing output
- **Persistent Connection**: Reconnects every 5 seconds if disconnected
- **No User Interaction**: Runs completely in background

## Security Notes

- Client connects only to configured server
- No local files are accessed except for command execution
- All communication is over WebSocket
- Client terminates cleanly when room is deleted