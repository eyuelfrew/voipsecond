#!/bin/bash

echo "🚀 Starting Agent Page..."

# Check if .env exists
if [ ! -f .env ]; then
    echo "📝 Creating .env file from .env.example..."
    cp .env.example .env
    echo "⚠️  Please edit .env with your configuration!"
    echo ""
fi

# Start dev server
echo "🔥 Starting Vite dev server..."
npm run dev
