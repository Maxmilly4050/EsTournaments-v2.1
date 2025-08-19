#!/bin/bash

echo "Starting Next.js development server to reproduce the issue..."
echo "The server will start on localhost:3000"
echo "Press Ctrl+C to stop the server"

# Install dependencies if node_modules doesn't exist or is incomplete
if [ ! -d "node_modules" ] || [ ! -f "node_modules/.pnpm/lock.yaml" ]; then
    echo "Installing dependencies..."
    pnpm install
fi

# Start the development server
echo "Starting development server..."
pnpm dev
