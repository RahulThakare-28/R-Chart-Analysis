#!/bin/bash

# Build all apps
echo "🔨 Building all apps..."
npm run build

if [ $? -eq 0 ]; then
    echo "✅ Build successful"
else
    echo "❌ Build failed"
    exit 1
fi
