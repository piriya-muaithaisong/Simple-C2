# Chat Client Executable

This client automatically connects to the server and executes commands sent from the admin interface.

## Pre-built Executables

The `dist/` folder contains ready-to-use executables:

- **Linux**: `./dist/chat-client`
- **Windows**: `dist/chat-client.exe`

## Usage

Simply run the executable - no arguments needed:

```bash
# Linux/Mac
./dist/chat-client

# Windows
chat-client.exe
```

The client will:
- Connect to `ws://localhost:8080` automatically
- Execute commands sent from admin (prefixed with `cmd:`)
- Send command output back to admin
- Display regular chat messages

## Configuration

To change the server URL:

1. Use the configuration script:
   ```bash
   ./configure-url.sh ws://your-server:8080
   ```

2. Rebuild the executable:
   ```bash
   npm run build        # Linux
   npm run build:win    # Windows
   npm run build:all    # All platforms
   ```

## Building from Source

Requirements: Node.js 18+

```bash
npm install
npm run build:all
```

## Commands

From the admin interface, send commands like:
- `cmd:whoami` - Show username
- `cmd:pwd` - Show current directory
- `cmd:ps aux` - Show processes
- `cmd:ls -la` - List files

Regular messages (without `cmd:` prefix) are displayed as chat messages.