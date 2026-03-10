#!/bin/bash

# ============================================
# Setup Script - Initialize project
# ============================================

set -e

PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

echo "🚀 Setting up ChartScanAI..."

# Create directories
echo "📁 Creating directory structure..."
mkdir -p "$PROJECT_DIR/data"
mkdir -p "$PROJECT_DIR/logs"
mkdir -p "$PROJECT_DIR/cache"

# Install dependencies
echo "📦 Installing dependencies..."
cd "$PROJECT_DIR"
npm install

# Setup environment
echo "⚙️  Setting up environment..."
if [ ! -f "$PROJECT_DIR/.env.development" ]; then
    cp "$PROJECT_DIR/config/.env.example" "$PROJECT_DIR/.env.development"
    echo "✓ Created .env.development (update with your settings)"
fi

if [ ! -f "$PROJECT_DIR/config/api-keys.json" ]; then
    cp "$PROJECT_DIR/config/api-keys.example.json" "$PROJECT_DIR/config/api-keys.json"
    echo "✓ Created config/api-keys.json (update with your API keys)"
fi

# Setup git hooks
echo "🔗 Setting up Git hooks..."
npm run prepare 2>/dev/null || true

echo ""
echo "✅ Setup complete!"
echo ""
echo "📖 Next steps:"
echo "   1. Update .env.development with your settings"
echo "   2. Update config/api-keys.json with your API keys"
echo "   3. Run: ./scripts/start.sh dev"
echo ""
