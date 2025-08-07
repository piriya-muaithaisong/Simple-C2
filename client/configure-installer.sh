#!/bin/bash

# Script to configure the installer with your server details

if [ -z "$1" ]; then
    echo "Usage: $0 <server-host:port>"
    echo "Example: $0 192.168.1.100:8080"
    echo "Example: $0 myserver.com:8080"
    echo ""
    echo "Current server in client-installer.js:"
    grep "SERVER_HOST" client-installer.js
    exit 1
fi

NEW_HOST="$1"

echo "Updating installer server to: $NEW_HOST"

# Update the server host in the installer
sed -i "s|const SERVER_HOST = '.*';|const SERVER_HOST = '$NEW_HOST';|" client-installer.js

# Also update the client files
sed -i "s|const SERVER_URL = '.*';|const SERVER_URL = 'ws://$NEW_HOST';|" client-headless.js
sed -i "s|const SERVER_URL = '.*';|const SERVER_URL = 'ws://$NEW_HOST';|" client-standalone.js

echo "Updated server configuration!"
echo ""
echo "Now build the installer and client:"
echo "npm run build:windows:silent    # Build the client"
echo "npm run build:installer         # Build the installer"

echo ""
echo "Updated files:"
grep "SERVER_HOST" client-installer.js
grep "SERVER_URL" client-headless.js