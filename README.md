# Chat System

A real-time chat system with admin web interface and CLI client.

## Quick Start

### Using Docker (Recommended)
```bash
docker-compose up
```
Admin interface: http://localhost:8080

### Manual Setup

1. **Start Server**
```bash
cd server
npm install
npm start
```

2. **Build Admin Frontend**
```bash
cd admin-frontend
npm install
npm run build
```

3. **Connect Client**
```bash
cd client
npm install
node chat-cli.js ws://localhost:8080
```

## Building Windows Executable

```bash
cd client
npm run build:win
```
The executable will be in `client/dist/chat-cli.exe`

## Usage

### Admin
- Open http://localhost:8080 in browser
- Click on connected clients to start chatting
- Messages are stored in SQLite database

### Client
- Run: `./chat-cli ws://localhost:8080`
- Type messages and press Enter to send
- Type "exit" to quit