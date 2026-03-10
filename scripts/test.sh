#!/bin/bash

# Run all tests
echo "🧪 Running tests..."
npm run test

if [ $? -eq 0 ]; then
    echo "✅ Tests passed"
else
    echo "❌ Tests failed"
    exit 1
fi
