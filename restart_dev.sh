#!/bin/bash

# Clear ports 3000 (Server) and 5000 (Client/Vite default)
echo "🧹 Clearing ports 3000 and 5000..."
lsof -ti:5000,3000 | xargs kill -9 2>/dev/null
echo "✅ Ports cleared."

# Start Backend Server (Background)
# We use () to spawn a subshell so 'cd' doesn't affect the main script
echo "🚀 Starting Backend Server..."
(cd server && node index.js) &
SERVER_PID=$!

# Wait a moment for server to initialize
sleep 2

# Start Frontend (Foreground)
# We are still in the project root because the previous 'cd' was in a subshell
echo "🎨 Starting Frontend (Vite)..."
npm run dev

# Cleanup on exit (if user Ctrl+C the frontend)
kill $SERVER_PID 2>/dev/null
