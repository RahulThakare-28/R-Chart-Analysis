# ChartScanAI - Complete Setup Guide

## 📋 Overview

This guide will help you get ChartScanAI up and running. The project is fully architected and ready for implementation of core features.

## ✅ What Has Been Set Up

### Folder Structure

```
✅ apps/
   ├── api/              - REST API (Express.js)
   ├── websocket-server/ - WebSocket server (Socket.io)
   └── web/              - Frontend dashboard (React)

✅ packages/
   ├── core/             - Core business logic
   ├── shared/           - Shared types & utilities
   └── config/           - Configuration management

✅ scripts/
   ├── start.sh         - Main entry point (single command to run all)
   ├── setup.sh         - Initial setup
   ├── build.sh         - Build all apps
   ├── test.sh          - Run all tests
   └── lint.sh          - Lint code

✅ config/
   ├── .env.example                - Environment template
   └── api-keys.example.json       - API keys template

✅ docker/
   ├── docker-compose.yml          - Full stack orchestration
   ├── Dockerfile.api              - API service
   ├── Dockerfile.websocket        - WebSocket service
   ├── Dockerfile.web              - Frontend service
   └── nginx.conf                  - Nginx configuration

✅ Documentation
   ├── ARCHITECTURE.md             - Detailed architecture
   ├── REQUIREMENTS.md             - Dependencies & tech stack
   ├── TODO.md                     - Implementation roadmap (12-week plan)
   ├── README.md                   - Project overview
   └── SETUP.md                    - This file

✅ Configuration Files
   ├── package.json                - Root monorepo config
   ├── tsconfig.json               - TypeScript configuration
   ├── turbo.json                  - Turborepo orchestration
   ├── .eslintrc.json              - ESLint rules
   ├── .prettierrc                 - Code formatting
   └── .gitignore                  - Git ignore rules
```

## 🚀 Getting Started

### 1. Prerequisites

Ensure you have:
- **Node.js** 18+ installed ([download here](https://nodejs.org/))
- **npm** 9+ (comes with Node.js)
- **Git** for version control
- (Optional) **Docker** for containerized deployment

Verify installation:
```bash
node --version   # Should be v18+
npm --version    # Should be v9+
git --version
```

### 2. Clone the Repository

```bash
git init .
git config user.email "you@example.com"
git config user.name "Your Name"
git add .
git commit -m "Initial ChartScanAI setup"
```

### 3. Run Setup Script

This automatically creates environment files:
```bash
./scripts/setup.sh
```

Output:
```
📁 Creating directory structure...
📦 Installing dependencies...
⚙️  Setting up environment...
✅ Setup complete!
```

### 4. Configure API Keys

#### Update `.env.development`

```bash
nano .env.development
```

Set critical variables:
```
NODE_ENV=development
API_PORT=3000
WS_PORT=3001
DB_TYPE=sqlite          # or postgresql
REDIS_URL=redis://localhost:6379
```

#### Update `config/api-keys.json`

```bash
nano config/api-keys.json
```

Enable brokers and add API keys:

**Grow.co.in:**
1. Sign up at https://grow.co.in
2. Go to Settings → API Keys
3. Copy your `apiKey`
4. Update in `config/api-keys.json`:
```json
"grow": {
  "enabled": true,
  "apiKey": "YOUR_GROW_API_KEY_HERE",
  ...
}
```

**Upstox:**
1. Sign up at https://upstox.com
2. Go to API/Settings
3. Create API credentials (OAuth)
4. Update in config:
```json
"upstox": {
  "enabled": true,
  "apiKey": "YOUR_UPSTOX_API_KEY_HERE",
  ...
}
```

**Ticker Tape:**
1. Sign up at https://www.tickertape.in
2. Get API key from Settings
3. Update in config:
```json
"tickerTape": {
  "enabled": true,
  "apiKey": "YOUR_TICKER_TAPE_API_KEY_HERE",
  ...
}
```

### 5. Start the Project

#### Development Mode (Recommended for local development)

```bash
./scripts/start.sh dev
```

This starts:
- 🌐 API Server: http://localhost:3000
- 📡 WebSocket: ws://localhost:3001
- 🎨 Frontend: http://localhost:5173

All services run in parallel with hot-reload!

#### Production Mode

```bash
./scripts/start.sh prod
```

#### Docker Mode

```bash
./scripts/start.sh docker
```

## 📊 Project Commands

### Development

```bash
# Single command to start all services
./scripts/start.sh dev

# Or use npm from workspace
npm run dev
```

### Building

```bash
./scripts/build.sh
# or
npm run build
```

### Testing

```bash
./scripts/test.sh
# or
npm run test
```

### Linting

```bash
./scripts/lint.sh
# or
npm run lint
npm run lint:fix
```

## 🔧 Database Setup

### SQLite (Recommended for Development)

✅ **No setup needed!** Automatically created on first run.

### PostgreSQL (Recommended for Production)

**Local Installation:**
```bash
# macOS
brew install postgresql
brew services start postgresql

# Ubuntu
sudo apt-get install postgresql postgresql-contrib
sudo systemctl start postgresql

# Windows
# Download from https://www.postgresql.org/download/windows/
```

**Create Database:**
```bash
createdb chartscanai

# Or via psql
createuser chartscanai_user
createdb -O chartscanai_user chartscanai
```

**Update .env.development:**
```
DB_TYPE=postgresql
DB_HOST=localhost
DB_PORT=5432
DB_NAME=chartscanai
DB_USER=chartscanai_user
DB_PASSWORD=your_password
```

## 🔴 Redis Setup

### Local Installation (Recommended for Development)

**macOS:**
```bash
brew install redis
brew services start redis
```

**Ubuntu:**
```bash
sudo apt-get install redis-server
sudo systemctl start redis-server
```

**Windows:**
- Use Windows Subsystem for Linux (WSL)
- Or use Docker: `docker run -d -p 6379:6379 redis:latest`

**Cloud Redis (Production):**
- Use Upstash: https://upstash.com/
- Free tier: 10,000 commands/day
- Add to .env: `REDIS_URL=redis://default:password@host:port`

## 🌐 Accessing Services

### API Documentation
- **Local**: http://localhost:3000/api/docs
- **Features**: Swagger UI for all endpoints

### WebSocket Connection
- **URL**: ws://localhost:3001
- **Rooms**: /patterns, /quotes, /alerts

### Frontend Dashboard
- **Local**: http://localhost:5173
- **Features**: Charts, watchlist, alerts, analytics

## 📁 Folder Structure Reference

```
ChartScanAI/
├── apps/
│   ├── api/src/
│   │   ├── middleware/       - Express middleware
│   │   ├── routes/          - API routes
│   │   ├── controllers/      - Request handlers
│   │   └── services/        - Business logic
│   │
│   ├── websocket-server/src/
│   │   ├── handlers/        - Event handlers
│   │   ├── events/          - Event definitions
│   │   └── utils/           - Utilities
│   │
│   └── web/src/
│       ├── components/      - React components
│       ├── pages/          - Page components
│       ├── services/       - API clients
│       ├── hooks/          - Custom React hooks
│       └── store/          - Zustand store
│
├── packages/
│   ├── core/src/
│   │   ├── patterns/        - Pattern detection
│   │   ├── data-aggregation/ - Broker integrations
│   │   ├── storage/         - Database & cache
│   │   └── alerts/          - Alert system
│   │
│   ├── shared/src/
│   │   ├── types/          - TypeScript types
│   │   ├── constants/      - Constants
│   │   └── utils/          - Utilities
│   │
│   └── config/src/
│       ├── index.ts        - Config loader
│       └── defaults.json   - Default config
│
├── docs/                    - Documentation
├── docker/                  - Docker configs
├── tests/                   - Tests
└── scripts/                 - Automation scripts
```

## 🎯 Next Steps

1. ✅ **Setup Complete** - All infrastructure is ready
2. 🔧 **Configuration** - Add your API keys
3. 💻 **Implementation** - Start coding (see TODO.md for roadmap)
4. 🧪 **Testing** - Write and run tests
5. 🚀 **Deployment** - Deploy to production

See **TODO.md** for the detailed 12-week implementation roadmap.

## 🧠 Architecture Overview

### Key Components

**Pattern Detection Engine**
- Analyzes candlestick data
- Detects chart patterns (Engulfing, Hammer, Doji, etc.)
- Generates confidence scores

**Data Aggregation**
- Connects to multiple brokers
- Normalizes data formats
- Caches for performance

**Alert System**
- Monitors patterns in real-time
- Triggers notifications
- Manages subscriptions

**API Server**
- REST endpoints for data access
- Real-time WebSocket updates
- User management (future)

**Frontend Dashboard**
- Live candlestick charts
- Pattern detection alerts
- Watchlist management
- Analytics & statistics

## 🔐 Security Checklist

- ✅ `.env*` files in .gitignore (never commit secrets)
- ✅ API keys in separate `config/api-keys.json`
- ✅ Input validation on all endpoints
- ✅ Rate limiting configured
- ✅ CORS restricted to trusted domains
- ✅ HTTPS enforced in production
- ✅ Environment-specific configurations

## 📚 Documentation Map

| Document | Purpose |
|----------|---------|
| ARCHITECTURE.md | Technical design & data flow |
| REQUIREMENTS.md | Dependencies & free resources |
| TODO.md | 12-week implementation roadmap |
| README.md | Project overview |
| SETUP.md | This file - Getting started |
| docs/API.md | API endpoint documentation |
| docs/BROKERS.md | Broker integration guide |
| docs/PATTERNS.md | Candlestick pattern definitions |
| docs/DEPLOYMENT.md | Production deployment guide |

## ❓ Troubleshooting

### Port Already in Use

```bash
# Kill process on port 3000
lsof -ti:3000 | xargs kill -9

# Or use different port
API_PORT=3001 ./scripts/start.sh dev
```

### Dependencies Not Installing

```bash
# Clear cache and reinstall
npm cache clean --force
rm -rf node_modules package-lock.json
npm install
```

### Database Connection Error

```bash
# Check PostgreSQL is running
psql -U postgres -c "SELECT 1"

# Or use SQLite instead
DB_TYPE=sqlite ./scripts/start.sh dev
```

### Redis Connection Error

```bash
# Check Redis is running
redis-cli ping
# Should return: PONG

# Start Redis
redis-server
```

## 📞 Support

- 📖 Read **docs/DEPLOYMENT.md** for deployment issues
- 🐛 Check **TODO.md** for implementation guidance
- 💬 Review architecture in **ARCHITECTURE.md**

## ✨ Key Features Ready to Implement

- [x] Architecture & folder structure
- [x] Configuration management
- [x] Docker & containerization
- [ ] Pattern detection algorithms
- [ ] Broker integrations (Grow, Upstox, Ticker Tape)
- [ ] Real-time WebSocket server
- [ ] REST API endpoints
- [ ] Frontend dashboard
- [ ] Database & caching layer
- [ ] Alert system
- [ ] Live screen reader

---

**You're all set!** Start with: `./scripts/start.sh dev`

For detailed implementation, see **TODO.md** for the 12-week roadmap.
