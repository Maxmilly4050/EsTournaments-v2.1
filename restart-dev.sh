#!/bin/bash
echo "🔄 Restarting development server with clean state..."
echo "1. Stopping any running processes..."
pkill -f "next dev" 2>/dev/null || true
echo "2. Clearing build cache..."
rm -rf .next
echo "3. Installing dependencies..."
npm install
echo "4. Starting development server..."
npm run dev
