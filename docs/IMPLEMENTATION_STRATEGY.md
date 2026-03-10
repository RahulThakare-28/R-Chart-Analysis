# ChartScanAI - Implementation Strategy & Architecture Guide

## 🎯 Project Vision

A **modular, scalable, production-ready** real-time candlestick pattern detection system that:
- Detects trading patterns in real-time
- Aggregates data from multiple brokers (Grow, Upstox, Ticker Tape)
- Provides live alerts and analytics
- Uses **free resources** for cost-efficiency
- Has **ONE command** to run the entire project
- Can be deployed **locally or on cloud**

---

## 🏗️ Architecture Overview

### System Components

```
┌─────────────────────────────────────────────────────────┐
│            FRONTEND (React + Vite)                       │
│         Charts • Watchlist • Analytics • Alerts          │
└──────────────────────┬──────────────────────────────────┘
                       │
         ┌─────────────┼─────────────┐
         │             │             │
    ┌────▼───┐  ┌────▼────┐  ┌────▼────┐
    │ REST   │  │WebSocket│  │  Nginx  │
    │ API    │  │ Server  │  │ Proxy   │
    │(3000)  │  │ (3001)  │  │ (80)    │
    └────┬───┘  └────┬────┘  └─────────┘
         │           │
    ┌────▼───────────▼────┐
    │  CORE LAYER         │
    │ Pattern Detection   │
    │ Data Aggregation    │
    │ Alert System        │
    └────┬───────────────┘
         │
    ┌────▼────────────────────────┐
    │  DATA & CACHE LAYER         │
    │ PostgreSQL/SQLite • Redis    │
    └─────────────────────────────┘
         │
    ┌────▼────────────────────────┐
    │  BROKER INTEGRATIONS        │
    │ Grow • Upstox • Ticker Tape │
    └─────────────────────────────┘
```

### Monorepo Structure

```
packages/
├── core/           - Business logic (reusable across services)
├── shared/         - Types, constants, utilities
└── config/         - Configuration management

apps/
├── api/            - REST API (consumes core)
├── websocket/      - Real-time server (consumes core)
└── web/            - Frontend (uses API + WebSocket)
```

---

## 🚀 One Command to Rule Them All

### The Master Script: `./scripts/start.sh`

```bash
./scripts/start.sh [dev|prod|docker]
```

**What it does:**
1. ✅ Checks Node.js version
2. ✅ Installs dependencies (if needed)
3. ✅ Creates environment files (if needed)
4. ✅ Sets up database (if needed)
5. ✅ Starts ALL services in parallel using Turbo

**Development Output:**
```
═══════════════════════════════════════
  ChartScanAI - Startup Script
═══════════════════════════════════════
ℹ Mode: dev
✓ Node.js v18.17.0 detected
✓ Dependencies already installed
ℹ Setting up environment...
✓ .env.development ready
ℹ Starting all services in parallel...

🚀 Services starting:
   - API Server (port 3000)
   - WebSocket Server (port 3001)
   - Frontend Dev Server (port 5173)

💡 Access:
   - API: http://localhost:3000
   - Frontend: http://localhost:5173
   - WebSocket: ws://localhost:3001

Press Ctrl+C to stop
```

---

## 📁 Naming Conventions

### Directories (kebab-case)
```
data-aggregation/
screen-reader/
pattern-detection/
real-time-updates/
```

### Files (camelCase for logic)
```
patternDetector.ts
brokerAdapter.ts
dataAggregator.ts
alertNotifier.ts
```

### Components (PascalCase)
```
PatternCard.tsx
ChartComponent.tsx
AlertList.tsx
```

### Constants (UPPER_SNAKE_CASE)
```
MAX_RETRIES = 3
CACHE_TTL = 300
API_TIMEOUT = 5000
```

---

## 🔄 Data Flow Architecture

### Real-time Pattern Detection Flow

```
1. BROKER DATA INPUT
   Grow/Upstok/Ticker Tape APIs
   ↓
2. DATA AGGREGATION
   Normalize • Validate • Merge
   ↓
3. CACHING
   Redis (hot cache) / File (fallback)
   ↓
4. PATTERN DETECTION
   Analyze candlesticks
   Identify patterns (Engulfing, Hammer, etc.)
   Calculate confidence scores
   ↓
5. ALERT GENERATION
   Check subscriptions
   Create alert objects
   ↓
6. NOTIFICATION
   WebSocket broadcast → Frontend
   Email/SMS (optional)
   ↓
7. STORAGE
   Save to PostgreSQL/SQLite
   Archive historical data
   ↓
8. DISPLAY
   Frontend dashboard receives real-time update
   User sees pattern alert
```

### Live Screen Reading Flow (for Ticker Tape)

```
1. SCREEN CAPTURE
   Puppeteer/Playwright captures screenshot
   ↓
2. OCR PROCESSING
   Tesseract extracts text (symbols, prices)
   ↓
3. NORMALIZATION
   Convert to standard Candle format
   ↓
4-8. (Same as above)
```

---

## 🔧 Configuration Management

### Why Multiple Config Layers?

```
.env (Development)
├── Database URL
├── Redis URL
├── API ports
└── Log level

config/api-keys.json (Sensitive)
├── Grow credentials
├── Upstox credentials
└── Ticker Tape credentials

config/app-config.json (App)
├── Broker endpoints
├── Rate limits
├── Feature flags
└── Cache TTL
```

### Free Resources Strategy

| Component | Option | Why |
|-----------|--------|-----|
| **Database** | SQLite (dev) + PostgreSQL (prod) | SQLite for local, Railway for free cloud |
| **Cache** | Local Redis (dev) + Upstash (prod) | Free tier sufficient for MVP |
| **Hosting** | Railway.app or Render | Free tier available |
| **APIs** | Free tiers of all brokers | No initial cost |

---

## 🎯 Implementation Phases

### ✅ Phase 1: Setup (COMPLETE)
- Architecture design
- Folder structure
- Configuration files
- Documentation
- Docker setup

### 🔄 Phase 2-3: Core Logic (NEXT)
- Pattern detection algorithms (8 patterns)
- Broker API adapters (3 brokers)
- Data aggregation layer

### 📡 Phase 4-6: Services
- Database layer
- Cache layer
- Alert system
- REST API
- WebSocket server

### 🎨 Phase 7-8: Frontend
- Dashboard UI
- Charts
- Watchlist
- Real-time updates

### 🚀 Phase 9-10: Production
- Testing
- Optimization
- Deployment
- Monitoring

---

## 💻 Development Workflow

### Local Development

```bash
# 1. Setup (one-time)
./scripts/setup.sh

# 2. Configure
nano .env.development
nano config/api-keys.json

# 3. Start everything
./scripts/start.sh dev

# 4. Access services
# API: http://localhost:3000
# Frontend: http://localhost:5173
# WebSocket: ws://localhost:3001

# 5. In another terminal, develop
cd apps/api
npm run dev:watch    # Hot reload

# 6. Run tests
npm run test:watch

# 7. Check code quality
npm run lint:fix
```

### Production Deployment

```bash
# Build everything
./scripts/build.sh

# Using Docker Compose
./scripts/start.sh docker

# Or deploy to cloud
git push railway main
```

---

## 🧬 Key Architectural Decisions

### 1. **Monorepo (Turborepo)**
- ✅ Single source of truth
- ✅ Code reuse across apps
- ✅ Single npm install
- ✅ Parallel builds

### 2. **Loose Coupling**
- ✅ Core logic in packages
- ✅ Apps consume packages
- ✅ Easy to replace components
- ✅ Scalable to microservices

### 3. **Free Resources First**
- ✅ SQLite/PostgreSQL (free tiers)
- ✅ Redis (Upstash free tier)
- ✅ Free broker APIs
- ✅ Railway/Render for hosting

### 4. **Single Entry Point**
- ✅ `./scripts/start.sh dev` runs everything
- ✅ No manual service startup
- ✅ Orchestrated by Turbo

### 5. **Real-time First**
- ✅ WebSocket for live updates
- ✅ Redis pub/sub for scaling
- ✅ Event-driven architecture

---

## 📊 Performance Targets

| Metric | Target | Why |
|--------|--------|-----|
| API Response | < 200ms | User experience |
| WebSocket Latency | < 100ms | Real-time feel |
| Pattern Detection | < 500ms/symbol | Quick analysis |
| Cache Hit Rate | > 80% | Reduced DB load |
| Memory Usage | < 500MB | Efficient resource use |
| Startup Time | < 30s | Fast development cycle |

---

## 🔐 Security Architecture

### API Security
```
Request
  ↓
Rate Limiter (100 req/min per IP)
  ↓
CORS Check (trusted domains only)
  ↓
Input Validation (Joi)
  ↓
Authentication (JWT - future)
  ↓
Authorization (Role-based - future)
  ↓
Logging (Winston)
```

### Configuration Security
```
.env         → Never commit (in .gitignore)
api-keys.json → Never commit (in .gitignore)
Environment  → Loaded at runtime
Secrets      → Injected via CI/CD
```

### Database Security
```
Connection Pool → Prevent exhaustion
Prepared Statements → Prevent SQL injection
Encrypted Passwords → Never store plaintext
Backup Strategy → Regular backups
```

---

## 🧪 Testing Strategy

### Unit Tests
```
packages/core/tests/
├── patterns/
│   ├── engulfing.test.ts
│   ├── hammer.test.ts
│   └── ...
├── brokers/
│   ├── grow.test.ts
│   ├── upstox.test.ts
│   └── ...
└── storage/
    └── cache.test.ts
```

### Integration Tests
```
tests/integration/
├── pattern-detection.test.ts
├── broker-integration.test.ts
├── alert-system.test.ts
└── api-endpoints.test.ts
```

### E2E Tests
```
tests/e2e/
├── full-flow.test.ts
└── real-time-updates.test.ts
```

---

## 📈 Scalability Path

### Local → MVP (Current)
- ✅ SQLite
- ✅ Local Redis
- ✅ One machine

### MVP → Production (Next)
- ✅ PostgreSQL
- ✅ Upstash Redis
- ✅ Railway.app/Render

### Production → Scale (Future)
- ✅ Database replication
- ✅ Load balancing
- ✅ Kubernetes
- ✅ Microservices

---

## 🎓 Learning Resources

### For Each Technology
- **TypeScript**: Official docs + handbook
- **Node.js**: nodejs.org guides
- **Express**: expressjs.com guides
- **Socket.io**: socket.io documentation
- **React**: react.dev documentation

### Candlestick Patterns
- Investopedia guides
- TradingView documentation
- Pattern definitions in `packages/core/patterns`

### Free APIs
- Grow: https://grow.co.in/docs
- Upstox: https://upstox.com/docs
- Ticker Tape: https://www.tickertape.in/docs

---

## 🎯 Success Metrics

### Development
- [ ] All unit tests passing
- [ ] Code coverage > 80%
- [ ] Zero ESLint errors
- [ ] TypeScript strict mode

### Performance
- [ ] Pattern detection < 500ms
- [ ] WebSocket latency < 100ms
- [ ] Memory usage stable

### Functionality
- [ ] All 8 patterns detecting correctly
- [ ] Real-time alerts working
- [ ] Dashboard responsive
- [ ] API endpoints documented

### Production
- [ ] Zero downtime deployment
- [ ] Auto-scaling working
- [ ] Monitoring alerts configured
- [ ] Backups tested

---

## 🚀 Quick Reference: What Runs Where

| Component | Technology | Port | File |
|-----------|-----------|------|------|
| REST API | Express | 3000 | `apps/api/src/main.ts` |
| WebSocket | Socket.io | 3001 | `apps/websocket-server/src/main.ts` |
| Frontend | React/Vite | 5173 | `apps/web/src/App.tsx` |
| Database | PostgreSQL/SQLite | 5432 | Configured in .env |
| Cache | Redis | 6379 | Configured in .env |
| Patterns | TypeScript | - | `packages/core/src/patterns` |
| Brokers | TypeScript | - | `packages/core/src/data-aggregation/brokers` |

---

## 📞 Command Reference

```bash
# Start everything with one command!
./scripts/start.sh dev

# Or use npm from root
npm run dev

# Build all apps
./scripts/build.sh
npm run build

# Run all tests
./scripts/test.sh
npm run test

# Check TypeScript
npm run type-check

# Lint and format
./scripts/lint.sh
npm run lint
npm run lint:fix
npm run format

# Docker deployment
./scripts/start.sh docker
docker-compose -f docker/docker-compose.yml up -d
```

---

## ✨ What Makes This Special

1. **Complete from Day 1**: Architecture, config, docs all ready
2. **One Command to Start**: `./scripts/start.sh dev`
3. **Production Grade**: Docker, health checks, monitoring
4. **Cost Efficient**: Free resources everywhere possible
5. **Well Documented**: Guides for every aspect
6. **Scalable Design**: Ready to grow from MVP to production
7. **Developer Experience**: Hot reload, TypeScript, great tooling
8. **Real-time Ready**: WebSocket, Redis, event-driven

---

**Ready to start implementing?** See TODO.md for the detailed 12-week roadmap! 🚀
