# ChartScanAI 📈

> Real-time candlestick pattern detection for stock market analysis with multi-broker integration

## Overview

ChartScanAI is a comprehensive stock market analysis platform that detects candlestick patterns in real-time and aggregates live data from multiple Indian stock brokers (Grow, Upstok, Ticker Tape). It provides real-time alerts, pattern analysis, and a modern web dashboard for traders.

## ✨ Features

- **Real-time Pattern Detection**: Identifies candlestick patterns (Engulfing, Hammer, Doji, etc.)
- **Multi-Broker Integration**: Connect to Grow, Upstok, and Ticker Tape
- **Live Data Aggregation**: Combines data from multiple sources
- **Real-time Alerts**: WebSocket-based instant pattern notifications
- **Live Screen Reader**: Capture and analyze live broker screens
- **Web Dashboard**: Modern React-based UI with TradingView charts
- **Watchlist Management**: Track custom symbols
- **Pattern Analytics**: Historical analysis and performance metrics
- **Free Resources Priority**: Uses free tiers and open-source technologies

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- npm/yarn/pnpm
- (Optional) PostgreSQL / Redis for production

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/ChartScanAI.git
cd ChartScanAI

# Setup (creates environment files)
./scripts/setup.sh

# Edit configuration
nano .env.development
nano config/api-keys.json

# Start all services (single command)
./scripts/start.sh dev
```

**That's it!** All services start in parallel:
- 🌐 API: http://localhost:3000
- 📡 WebSocket: ws://localhost:3001
- 🎨 Frontend: http://localhost:5173

### Using Docker

```bash
# Start complete stack with Docker
./scripts/start.sh docker

# Or manually with docker-compose
docker-compose -f docker/docker-compose.yml up -d
```

## 📁 Project Structure

```
ChartScanAI/
├── apps/                    # Application layer
│   ├── api/                # REST API (Express.js)
│   ├── websocket-server/   # Real-time updates (Socket.io)
│   └── web/                # Frontend dashboard (React)
│
├── packages/               # Shared packages
│   ├── core/               # Business logic (patterns, brokers, alerts)
│   ├── shared/             # Shared types and utilities
│   └── config/             # Configuration management
│
├── scripts/                # Automation scripts
│   ├── start.sh           # 🚀 Main entry point
│   ├── setup.sh           # Initial setup
│   ├── build.sh           # Build all apps
│   ├── test.sh            # Run tests
│   └── lint.sh            # Lint code
│
├── config/                # Configuration files
│   ├── .env.example       # Environment template
│   └── api-keys.example.json  # API keys template
│
├── docs/                  # Documentation
├── docker/                # Docker configuration
├── tests/                 # Integration & E2E tests
│
├── ARCHITECTURE.md        # Architecture documentation
├── REQUIREMENTS.md        # Dependencies and requirements
├── TODO.md               # Implementation roadmap
└── README.md             # This file
```

## 🔧 Available Commands

### One-Command Operations

```bash
# Development (watch mode, all services)
./scripts/start.sh dev

# Production build and run
./scripts/start.sh prod

# Docker deployment
./scripts/start.sh docker

# Initial setup
./scripts/setup.sh

# Build all apps
./scripts/build.sh

# Run all tests
./scripts/test.sh

# Lint and format
./scripts/lint.sh
```

### Using npm (from root)

```bash
npm run dev          # Start all services
npm run build        # Build all packages
npm run test         # Run all tests
npm run lint         # Lint all code
npm run format       # Format code
npm run type-check   # TypeScript type checking
```

## 🔑 Configuration

### Environment Variables (.env.development)

Create from template:
```bash
cp config/.env.example .env.development
```

Key variables:
```
NODE_ENV=development
API_PORT=3000
WS_PORT=3001
DB_TYPE=sqlite
REDIS_URL=redis://localhost:6379
```

### API Keys (config/api-keys.json)

Create from template:
```bash
cp config/api-keys.example.json config/api-keys.json
```

Add your broker API keys:
- [Grow API Keys](https://grow.co.in)
- [Upstox API Keys](https://upstox.com)
- [Ticker Tape API Keys](https://www.tickertape.in)

## 📚 Documentation

- **[ARCHITECTURE.md](./ARCHITECTURE.md)** - Detailed architecture overview
- **[REQUIREMENTS.md](./REQUIREMENTS.md)** - Dependencies and setup guide
- **[TODO.md](./TODO.md)** - Implementation roadmap and tasks
- **docs/API.md** - REST API documentation
- **docs/BROKERS.md** - Broker integration guide
- **docs/PATTERNS.md** - Candlestick pattern definitions
- **docs/SETUP.md** - Detailed setup instructions
- **docs/DEPLOYMENT.md** - Deployment guide

## 🛠 Tech Stack

### Backend
- **Node.js** - JavaScript runtime
- **TypeScript** - Type-safe development
- **Express.js** - REST API framework
- **Socket.io** - Real-time WebSocket communication
- **PostgreSQL/SQLite** - Database
- **Redis** - Caching layer
- **Turborepo** - Monorepo orchestration

### Frontend
- **React 18** - UI framework
- **Vite** - Build tool
- **Zustand** - State management
- **TradingView Lightweight Charts** - Candlestick charts
- **Tailwind CSS** - Styling
- **Socket.io Client** - Real-time updates

### Development
- **TypeScript** - Type checking
- **Jest** - Testing framework
- **ESLint** - Code linting
- **Prettier** - Code formatting

## 🧪 Testing

```bash
# Run all tests
npm run test

# Run tests in watch mode
npm run test:watch

# Coverage report
npm run test:coverage
```

## 📊 Supported Candlestick Patterns

- ✅ Engulfing (Bullish & Bearish)
- ✅ Hammer
- ✅ Shooting Star
- ✅ Doji
- ✅ Morning Star
- ✅ Evening Star
- ✅ Three White Soldiers
- ✅ Three Black Crows
- ✅ Harami (Bullish & Bearish)

## 🔌 Broker Support

| Broker | Status | Features |
|--------|--------|----------|
| **Grow** | ✅ Ready | REST API, Quote, Historical Data |
| **Upstox** | ✅ Ready | OAuth, WebSocket, Market Data |
| **Ticker Tape** | ✅ Ready | API, Screen Reader, Charts |

## 📡 API Endpoints

### Patterns
```
GET    /api/patterns              - List detected patterns
POST   /api/patterns/detect       - Manually trigger detection
GET    /api/patterns/:id          - Pattern details
WebSocket: ws://localhost:3001/patterns
```

### Market Data
```
GET    /api/quotes/:symbol        - Current quote
GET    /api/candles/:symbol       - Candle data
GET    /api/brokers               - Connected brokers
```

### Alerts
```
GET    /api/alerts                - List alerts
POST   /api/subscriptions         - Create subscription
DELETE /api/subscriptions/:id     - Remove subscription
```

See **docs/API.md** for complete API documentation.

## 🚢 Deployment

### Railway.app (Recommended for free tier)

```bash
# Build and push
npm run build
git push railway main
```

### Docker

```bash
# Build images
docker-compose build

# Start services
docker-compose up -d

# View logs
docker-compose logs -f
```

See **docs/DEPLOYMENT.md** for detailed deployment options.

## 📈 Performance

- **API Response**: < 200ms
- **WebSocket Latency**: < 100ms
- **Pattern Detection**: < 500ms per symbol
- **Cache Hit Rate**: > 80%

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## ⚠️ Disclaimer

**This project is for educational and research purposes only.** Trading based on automated pattern detection involves risk. Always conduct your own research and consider consulting with a financial advisor before making investment decisions.

## 🆘 Support & Issues

- 📖 [Documentation](./docs)
- 🐛 [Report Issues](https://github.com/yourusername/ChartScanAI/issues)
- 💬 [Discussions](https://github.com/yourusername/ChartScanAI/discussions)

## 🎯 Roadmap

See **TODO.md** for the complete implementation roadmap including:
- Phase 1: Project Setup ✅
- Phase 2: Core Business Logic
- Phase 3: Broker Integrations
- Phase 4: Data Storage
- Phase 5: Alert System
- Phase 6: Backend APIs
- Phase 7: Frontend Dashboard
- Phase 8: Testing & Integration
- Phase 9: Deployment
- Phase 10: Post-Launch

## 🌟 Acknowledgments

- Built with free and open-source technologies
- Inspired by professional trading platforms
- Community-driven development

---

**Made with ❤️ for traders and developers**

For updates, follow the [GitHub repository](https://github.com/yourusername/ChartScanAI)
