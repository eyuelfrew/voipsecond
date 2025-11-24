#!/bin/bash

echo "🧹 Cleaning Vite cache and node_modules cache..."

# Remove Vite cache
rm -rf node_modules/.vite

# Remove dist folder
rm -rf dist

echo "✅ Cache cleared!"
echo ""
echo "Now run: npm run dev"
