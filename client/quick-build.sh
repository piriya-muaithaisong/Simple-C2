#!/bin/bash
# Quick build script - even simpler!

SERVER="${1:-localhost:8080}"

echo "Building for server: $SERVER"

# Configure
./configure-installer.sh "$SERVER" >/dev/null 2>&1

# Build everything
npm run build:windows:silent >/dev/null 2>&1
npm run build:installer

echo "✅ Done! Installer ready: dist/client-installer.exe"