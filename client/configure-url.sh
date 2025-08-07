#!/bin/bash

# Script to configure the server URL in the client

if [ -z "$1" ]; then
    echo "Usage: $0 <server-url>"
    echo "Example: $0 ws://192.168.1.100:8080"
    echo "Current URL in client-standalone.js:"
    grep "SERVER_URL" client-standalone.js
    exit 1
fi

NEW_URL="$1"

echo "Updating server URL to: $NEW_URL"

# Update the URL in the client file
sed -i "s|const SERVER_URL = '.*';|const SERVER_URL = '$NEW_URL';|" client-standalone.js

echo "URL updated! Now rebuild the executable:"
echo "npm run build        # For Linux"
echo "npm run build:win    # For Windows"
echo "npm run build:all    # For all platforms"

echo ""
echo "Updated client-standalone.js:"
grep "SERVER_URL" client-standalone.js