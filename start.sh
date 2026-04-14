#!/bin/bash

set -e

PROJECT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$PROJECT_DIR"

echo ""
echo "╔══════════════════════════════════════════════════════╗"
echo "║   AGENTIZED CONTENT CREATION SYSTEM                  ║"
echo "║   Scrape → Validate → Write → Hook → Voice → Video  ║"
echo "╚══════════════════════════════════════════════════════╝"
echo ""

# Check Node.js
if ! command -v node &>/dev/null; then
  echo "ERROR: Node.js is not installed."
  echo "Download it from https://nodejs.org"
  exit 1
fi

NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
  echo "ERROR: Node.js 18+ required. You have $(node -v)."
  exit 1
fi

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
  echo "Installing dependencies..."
  npm install --silent
  echo "Done."
  echo ""
fi

# Check .env.local
if [ ! -f ".env.local" ]; then
  echo "No .env.local found. Please create one with your API keys."
  echo "Required: ANTHROPIC_API_KEY, PEXELS_API_KEY, YOUTUBE_CLIENT_ID, YOUTUBE_CLIENT_SECRET"
  exit 1
fi

# Ensure data directory exists
mkdir -p data
if [ ! -f "data/results.json" ]; then
  echo '{"runs":[]}' > data/results.json
fi

echo "Starting app at http://localhost:3000"
echo "Press Ctrl+C to stop."
echo ""

# Kill any stale process on port 3000 before starting
lsof -ti :3000 | xargs kill -9 2>/dev/null || true

# Open browser after a short delay
(sleep 3 && open "http://localhost:3000") &

# Run dev server; on exit (Ctrl+C or window close) kill port 3000
trap 'echo ""; echo "Shutting down..."; lsof -ti :3000 | xargs kill -9 2>/dev/null || true; exit 0' INT TERM EXIT

npm run dev
