#!/bin/bash

echo "Building chat client executables..."

# Create dist directory if it doesn't exist
mkdir -p dist

# Build for Linux (current platform)
echo "Building for Linux..."
npm run build

# Build for Windows
echo "Building for Windows..."
npm run build:win

# Build for macOS
echo "Building for macOS..."
npm run build:mac

echo "Build complete! Executables are in the dist/ folder:"
ls -la dist/

echo ""
echo "Usage:"
echo "  Linux: ./dist/chat-client"
echo "  Windows: dist/chat-client.exe"
echo "  macOS: ./dist/chat-client-mac"