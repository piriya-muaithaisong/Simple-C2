#!/bin/bash

# Script to configure the server URL in the silent/headless client

if [ -z "$1" ]; then
    echo "Usage: $0 <server-url>"
    echo "Example: $0 ws://192.168.1.100:8080"
    echo "Current URL in client-headless.js:"
    grep "SERVER_URL" client-headless.js
    exit 1
fi

NEW_URL="$1"

echo "Updating server URL to: $NEW_URL"

# Update the URL in both client files
sed -i "s|const SERVER_URL = '.*';|const SERVER_URL = '$NEW_URL';|" client-headless.js
sed -i "s|const SERVER_URL = '.*';|const SERVER_URL = '$NEW_URL';|" client-standalone.js

echo "URL updated in both clients!"
echo ""
echo "Now rebuild the executables:"
echo "npm run build:silent:win    # For Windows silent client"
echo "npm run build:silent        # For Linux silent client"
echo "npm run build:silent:all    # For all platforms"

echo ""
echo "Updated files:"
grep "SERVER_URL" client-headless.js
grep "SERVER_URL" client-standalone.js