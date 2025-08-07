#!/bin/bash

# Script to run the chat system components manually without Docker
# For analysis purposes only

echo "Starting Chat System Components..."

# Check if node is installed
if ! command -v node &> /dev/null; then
    echo "Node.js is not installed. Please install Node.js first."
    exit 1
fi

# Install server dependencies
echo "Installing server dependencies..."
cd server
npm install

# Install admin frontend dependencies  
echo "Installing admin frontend dependencies..."
cd ../admin-frontend
npm install

# Build the admin frontend
echo "Building admin frontend..."
npm run build

# Start the server
echo "Starting server on port 8080..."
cd ../server
node server.js &
SERVER_PID=$!

echo "Server started with PID: $SERVER_PID"
echo "Admin interface available at: http://localhost:8080"
echo ""
echo "To connect a client, run:"
echo "  cd client && node chat-cli.js connect ws://localhost:8080"
echo ""
echo "Press Ctrl+C to stop the server"

# Wait for interrupt
trap "kill $SERVER_PID; exit" INT
wait