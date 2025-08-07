# Chat System Deployment Guide

## 📋 Prerequisites
- Node.js 18+ installed
- npm (comes with Node.js)
- Git (optional)

## 🚀 Quick Start

### Option 1: Using Docker (Easiest)
```bash
# Clone or download the project
cd mysimplec2

# Start everything with one command
docker-compose up

# Access admin interface
http://localhost:8080
```

### Option 2: Manual Setup

#### 1. Start the Server
```bash
cd server
npm install
npm start
```
The server will run on http://localhost:8080

#### 2. Build & Serve Admin Interface
```bash
cd admin-frontend
npm install
npm run build
```
The build files will be served automatically by the server.

#### 3. Connect with Client
```bash
cd client
npm install
node chat-cli.js ws://localhost:8080
```

## 💻 Converting Client to Windows EXE

### Prerequisites for Building EXE
- Node.js installed on your development machine
- pkg installed (included in devDependencies)

### Build Steps

1. **Navigate to client directory**
   ```bash
   cd client
   ```

2. **Install dependencies (if not already done)**
   ```bash
   npm install
   ```

3. **Build Windows executable**
   ```bash
   npm run build:win
   ```

4. **Find your executable**
   ```
   Location: client/dist/chat-cli.exe
   Size: ~37MB
   ```

### Alternative Build Commands

**Build for all platforms:**
```bash
npm run build:all
```
This creates executables for:
- Windows (chat-cli-win.exe)
- Linux (chat-cli-linux)
- macOS (chat-cli-macos)

**Manual pkg command:**
```bash
npx pkg . --targets node18-win-x64 --output dist/chat-cli.exe
```

## 🖥️ Using the Windows EXE

### On Windows Machine

1. **Copy the exe file** from `client/dist/chat-cli.exe` to any Windows computer

2. **Open Command Prompt or PowerShell**

3. **Run the client**
   ```cmd
   chat-cli.exe ws://YOUR_SERVER_IP:8080
   ```

### Examples
```cmd
# Connect to local server
chat-cli.exe ws://localhost:8080

# Connect to remote server
chat-cli.exe ws://192.168.1.100:8080

# Connect to server on internet
chat-cli.exe ws://example.com:8080
```

### Client Commands
- Type messages and press Enter to send
- Type `exit` to quit
- Use Ctrl+C to force quit

## 📁 Project Structure
```
mysimplec2/
├── server/                 # Backend server
│   ├── server.js          # Main server file
│   ├── package.json       # Server dependencies
│   └── chat.db           # SQLite database (created on first run)
├── admin-frontend/        # React admin interface
│   ├── src/              # React source files
│   ├── build/            # Built files (after npm run build)
│   └── package.json      # Frontend dependencies
├── client/               # CLI client
│   ├── chat-cli.js      # Client source code
│   ├── package.json     # Client dependencies
│   └── dist/            # Built executables
│       └── chat-cli.exe # Windows executable
└── docker-compose.yml   # Docker configuration
```

## 🔧 Configuration

### Server Port
Default: 8080
Change in `server/server.js`:
```javascript
const PORT = process.env.PORT || 8080;
```

### Database Location
Default: `server/chat.db`
Change in `server/server.js`:
```javascript
const db = new sqlite3.Database('./chat.db');
```

## 🐛 Troubleshooting

### Server won't start
- Check if port 8080 is already in use
- Run: `lsof -i :8080` (Linux/Mac) or `netstat -ano | findstr :8080` (Windows)

### Client can't connect
- Ensure server is running
- Check firewall settings
- Verify the WebSocket URL is correct

### EXE won't build
- Ensure you're in the `client` directory
- Run `npm install` first
- Check Node.js version (needs 18+)

### EXE won't run on Windows
- No installation needed - it's standalone
- Try running as administrator
- Check Windows Defender/Antivirus isn't blocking it

## 🚢 Production Deployment

### Using Docker
```bash
# Build and run in detached mode
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

### Using PM2 (Process Manager)
```bash
# Install PM2 globally
npm install -g pm2

# Start server
cd server
pm2 start server.js --name chat-server

# Save PM2 config
pm2 save
pm2 startup
```

### Nginx Reverse Proxy (for HTTPS)
```nginx
server {
    listen 443 ssl;
    server_name your-domain.com;
    
    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;
    
    location / {
        proxy_pass http://localhost:8080;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

## 📊 Features

- ✅ Real-time bidirectional chat
- ✅ Multiple client support
- ✅ Persistent message history
- ✅ Beautiful admin interface
- ✅ Cross-platform client
- ✅ Standalone Windows executable
- ✅ Docker support
- ✅ SQLite database

## 🔐 Security Notes

1. **For production use:**
   - Add authentication to admin interface
   - Use HTTPS/WSS for encrypted connections
   - Implement rate limiting
   - Add input validation and sanitization

2. **Firewall rules:**
   - Only expose port 8080 to trusted networks
   - Use VPN for remote access if possible

## 📝 License

This project is provided as-is for educational purposes.