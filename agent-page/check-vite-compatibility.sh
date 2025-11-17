#!/bin/bash

echo "🔍 Checking Vite Compatibility..."
echo ""

# Check for process.env usage
echo "1️⃣ Checking for process.env usage..."
if grep -r "process\.env" agent-page/src/ 2>/dev/null; then
    echo "❌ Found process.env usage! Please replace with import.meta.env"
    exit 1
else
    echo "✅ No process.env found"
fi

# Check for NODE_ENV usage
echo ""
echo "2️⃣ Checking for NODE_ENV usage..."
if grep -r "NODE_ENV" agent-page/src/ 2>/dev/null; then
    echo "⚠️  Found NODE_ENV usage! Should use import.meta.env.MODE instead"
else
    echo "✅ No NODE_ENV found"
fi

# Check for REACT_APP_ prefix
echo ""
echo "3️⃣ Checking for REACT_APP_ prefix..."
if grep -r "REACT_APP_" agent-page/src/ 2>/dev/null; then
    echo "⚠️  Found REACT_APP_ prefix! Should use VITE_ prefix instead"
else
    echo "✅ No REACT_APP_ prefix found"
fi

# Check if .env exists
echo ""
echo "4️⃣ Checking for .env file..."
if [ -f agent-page/.env ]; then
    echo "✅ .env file exists"
else
    echo "⚠️  .env file not found. Copy from .env.example"
fi

echo ""
echo "🎉 Vite compatibility check complete!"
