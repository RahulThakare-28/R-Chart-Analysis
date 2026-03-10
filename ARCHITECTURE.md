# ChartScanAI - Live Candlestick Pattern Detection Architecture

## Project Overview
ChartScanAI is a comprehensive stock market analysis platform that detects candlestick patterns in real-time and aggregates live data from multiple brokers (Grow, Upstok, Ticker Tape).

---

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                      Web Dashboard (React/Vue)                   │
│              Real-time charts, notifications, analytics          │
└────────────────────────────┬────────────────────────────────────┘
                             │
           ┌─────────────────┼─────────────────┐
           │                 │                 │
           ▼                 ▼                 ▼
    ┌─────────────┐  ┌──────────────┐  ┌──────────────┐
    │  REST API   │  │  WebSocket   │  │  gRPC APIs   │
    │  (Express)  │  │  Server      │  │  (Optional)  │
    └──────┬──────┘  └──────┬───────┘  └──────┬───────┘
           │                │                │
    ┌──────┴────────────────┴────────────────┴───────┐
    │      Core Application Layer (Node.js)          │
    └──────┬──────────────────────────────────────────┘
           │
    ┌──────┴─────────────────────────────────────────┐
    │         Pattern Detection Engine               │
    │  - Identify candlestick patterns               │
    │  - Real-time analysis                          │
    │  - Alert generation                            │
    └─────────────────────────────────────────────────┘
           │
    ┌──────┴───────────────────────────────────────────────────────┐
    │            Data Aggregation Layer                           │
    │  ┌──────────────┐  ┌────────────┐  ┌──────────────┐         │
    │  │ Grow API     │  │ Upstok API │  │ Ticker Tape  │         │
    │  │ Integration  │  │Integration │  │ Screen Read  │         │
    │  └──────────────┘  └────────────┘  └──────────────┘         │
    └───────────────────────────────────────────────────────────────┘
           │
    ┌──────┴─────────────────────────────────────────┐
    │      Data Storage & Caching Layer             │
    │  - Redis (real-time cache)                    │
    │  - SQLite/PostgreSQL (historical data)        │
    │  - File cache (fallback)                      │
    └─────────────────────────────────────────────────┘
```

---

## Folder Structure

```
ChartScanAI/
├── apps/
│   ├── api/                      # Express REST API
│   │   ├── src/
│   │   │   ├── main.ts
│   │   │   ├── middleware/
│   │   │   ├── routes/
│   │   │   ├── controllers/
│   │   │   └── services/
│   │   ├── tests/
│   │   └── package.json
│   │
│   ├── websocket-server/         # WebSocket Real-time Updates
│   │   ├── src/
│   │   │   ├── main.ts
│   │   │   ├── handlers/
│   │   │   ├── events/
│   │   │   └── utils/
│   │   ├── tests/
│   │   └── package.json
│   │
│   └── web/                      # Frontend Web Dashboard
│       ├── public/
│       ├── src/
│       │   ├── components/
│       │   ├── pages/
│       │   ├── services/
│       │   ├── hooks/
│       │   ├── store/
│       │   └── App.tsx
│       ├── tests/
│       └── package.json
│
├── packages/
│   ├── core/                     # Core Business Logic
│   │   ├── src/
│   │   │   ├── patterns/
│   │   │   │   ├── detectors/   # Pattern detection algorithms
│   │   │   │   ├── validators/  # Pattern validation
│   │   │   │   └── types.ts
│   │   │   │
│   │   │   ├── data-aggregation/
│   │   │   │   ├── brokers/     # Broker integrations
│   │   │   │   │   ├── grow.ts
│   │   │   │   │   ├── upstok.ts
│   │   │   │   │   └── ticker-tape.ts
│   │   │   │   ├── screen-reader/
│   │   │   │   ├── adapters/
│   │   │   │   └── types.ts
│   │   │   │
│   │   │   ├── storage/
│   │   │   │   ├── database/    # DB operations
│   │   │   │   ├── cache/       # Cache layer
│   │   │   │   └── types.ts
│   │   │   │
│   │   │   ├── alerts/
│   │   │   │   ├── detector.ts
│   │   │   │   ├── notifier.ts
│   │   │   │   └── types.ts
│   │   │   │
│   │   │   ├── utils/
│   │   │   │   ├── logger.ts
│   │   │   │   ├── validators.ts
│   │   │   │   └── constants.ts
│   │   │   │
│   │   │   └── index.ts
│   │   ├── tests/
│   │   └── package.json
│   │
│   ├── shared/                   # Shared utilities & types
│   │   ├── src/
│   │   │   ├── types/
│   │   │   ├── constants/
│   │   │   ├── utils/
│   │   │   └── interfaces/
│   │   └── package.json
│   │
│   └── config/                   # Configuration management
│       ├── src/
│       │   ├── index.ts
│       │   ├── dev.json
│       │   ├── prod.json
│       │   └── defaults.json
│       └── package.json
│
├── scripts/
│   ├── start.sh                  # Root start script (ONE COMMAND)
│   ├── dev.sh                    # Development mode
│   ├── build.sh                  # Build all apps
│   ├── test.sh                   # Run all tests
│   ├── lint.sh                   # Lint code
│   ├── migrate.sh                # Database migrations
│   └── setup.sh                  # Initial setup
│
├── config/
│   ├── .env.example              # Environment template
│   ├── .env.development          # Dev environment
│   ├── .env.production           # Prod environment
│   ├── api-keys-template.json    # API keys template
│   └── app-config.json           # App configuration
│
├── docker/
│   ├── Dockerfile.api
│   ├── Dockerfile.websocket
│   ├── Dockerfile.web
│   └── docker-compose.yml        # Full stack orchestration
│
├── docs/
│   ├── ARCHITECTURE.md           # This file
│   ├── SETUP.md                  # Setup instructions
│   ├── API.md                    # API documentation
│   ├── BROKERS.md                # Broker integration guide
│   ├── PATTERNS.md               # Pattern detection guide
│   └── DEPLOYMENT.md             # Deployment guide
│
├── tests/
│   ├── integration/
│   ├── e2e/
│   └── performance/
│
├── .gitignore
├── .eslintrc.json
├── .prettierrc
├── tsconfig.json
├── tsconfig.base.json
├── turbo.json                    # Monorepo configuration
├── package.json                  # Root package.json
├── REQUIREMENTS.md               # Dependencies & requirements
├── TODO.md                        # Project todos
├── README.md                      # Project readme
└── LICENSE
```

---

## Technology Stack

### Backend
- **Runtime**: Node.js 18+
- **Language**: TypeScript
- **Framework**: Express.js (REST API)
- **Real-time**: Socket.io (WebSocket)
- **Pattern Detection**: Custom TA (Technical Analysis) library
- **Data Processing**: Pandas-like libraries (Danfo.js) or D3-array
- **Testing**: Jest, Supertest
- **Monorepo**: Turborepo

### Frontend
- **Framework**: React 18+
- **State Management**: Zustand or Redux Toolkit
- **Charts**: TradingView Lightweight Charts / Chart.js
- **Real-time Updates**: Socket.io client
- **Build**: Vite
- **Testing**: Vitest, React Testing Library

### Database & Storage
- **Cache**: Redis (free tier available)
- **Primary DB**: PostgreSQL (free tier) or SQLite (local)
- **Message Queue**: BullMQ (job processing)

### Free Resources Priority
- **Broker APIs**: Free tiers (Grow, Upstok, Ticker Tape)
- **Hosting**: Railway.app / Render.com (free tier)
- **Database**: Railway PostgreSQL (free tier) or SQLite
- **Cache**: Upstash Redis (free tier) or local Redis
- **Monitoring**: OpenTelemetry (free)

---

## Core Components

### 1. Pattern Detection Engine
```typescript
interface CandlestickPattern {
  name: string;
  symbol: string;
  timeframe: string;
  confidence: number;
  candles: Candle[];
  timestamp: Date;
  action: 'BUY' | 'SELL' | 'NEUTRAL';
}

// Supported patterns
- Engulfing (Bullish/Bearish)
- Hammer (Bullish)
- Shooting Star (Bearish)
- Doji (Indecision)
- Morning Star (Bullish Reversal)
- Evening Star (Bearish Reversal)
- Three White Soldiers
- Three Black Crows
- Harami (Bullish/Bearish)
```

### 2. Broker Integration Layer
Each broker has a standardized adapter:
```typescript
interface BrokerAdapter {
  authenticate(): Promise<void>;
  getQuotes(symbols: string[]): Promise<Quote[]>;
  getCandles(symbol: string, period: string): Promise<Candle[]>;
  subscribeToUpdates(symbols: string[]): Observable<Update>;
}
```

### 3. Screen Reader (for Ticker Tape, etc.)
```typescript
interface ScreenReader {
  startCapture(): Promise<void>;
  detectPatterns(): Promise<Pattern[]>;
  parseSymbols(): Promise<string[]>;
  stopCapture(): Promise<void>;
}
```

---

## Naming Conventions

### Files
- `camelCase` for file names: `userService.ts`, `chartAdapter.ts`
- `PascalCase` for components: `PatternDetector.tsx`, `RealTimeChart.tsx`
- `kebab-case` for config files: `app-config.json`, `api-keys.json`

### Classes & Interfaces
- `PascalCase`: `PatternDetector`, `BrokerAdapter`, `DataAggregator`
- Interfaces start with `I` (optional): `IBrokerAdapter`, `IPattern`

### Functions & Variables
- `camelCase`: `detectPattern()`, `fetchQuotes()`, `isValidCandle()`

### Constants
- `UPPER_SNAKE_CASE`: `MAX_RETRIES`, `API_TIMEOUT`, `CACHE_TTL`

### Directories
- `kebab-case`: `data-aggregation/`, `screen-reader/`, `pattern-detection/`

---

## Data Flow

### Real-time Pattern Detection Flow
1. **Data Ingestion**: Broker APIs → Data Aggregator
2. **Caching**: Store in Redis for fast access
3. **Analysis**: Pattern Detection Engine processes candles
4. **Alert Generation**: Create alerts for detected patterns
5. **Notification**: Emit to WebSocket → Frontend
6. **Storage**: Archive to database for historical analysis

### Live Screen Reading Flow (Ticker Tape)
1. **Screen Capture**: OCR/video capture of broker screen
2. **Detection**: Extract symbols and price movements
3. **Normalization**: Convert to standard Candle format
4. **Processing**: Same as regular flow
5. **Display**: Show live detected patterns

---

## API Endpoints

### Pattern Detection
```
GET    /api/patterns                    - List all detected patterns
POST   /api/patterns/detect             - Manually trigger detection
GET    /api/patterns/:id                - Get pattern details
WebSocket: ws://localhost:3001/patterns - Real-time pattern stream
```

### Broker Data
```
GET    /api/quotes/:symbol              - Get current quote
GET    /api/candles/:symbol             - Get candle data
GET    /api/brokers                     - List connected brokers
POST   /api/brokers/:broker/connect     - Connect to broker
```

### Alerts & Subscriptions
```
GET    /api/alerts                      - Get all alerts
POST   /api/subscriptions               - Create alert subscription
DELETE /api/subscriptions/:id           - Remove subscription
```

### Analysis
```
GET    /api/analysis/symbols            - Watchlist
POST   /api/analysis/backtest           - Backtest patterns
GET    /api/analysis/stats              - Statistics
```

---

## Configuration Management

### Environment Variables (.env)
```
# API Keys
GROW_API_KEY=xxx
UPSTOK_API_KEY=xxx
TICKER_TAPE_API_KEY=xxx

# Database
DATABASE_URL=postgresql://...
REDIS_URL=redis://...

# Server
NODE_ENV=development
API_PORT=3000
WS_PORT=3001

# Logging
LOG_LEVEL=debug
```

### Global API Keys (api-keys.json)
```json
{
  "grow": {
    "apiKey": "xxx",
    "endpoint": "https://api.grow.co.in/...",
    "enabled": true
  },
  "upstok": {
    "apiKey": "xxx",
    "endpoint": "https://api.upstox.com/...",
    "enabled": true
  },
  "tickerTape": {
    "apiKey": "xxx",
    "endpoint": "https://api.tickertape.io/...",
    "enabled": true
  }
}
```

---

## Deployment Strategy

### Local Development
```bash
# Single command to run everything
./scripts/start.sh dev
```

### Docker Deployment
```bash
# Production stack
docker-compose -f docker/docker-compose.yml up -d
```

### Cloud Deployment
- **API & WebSocket**: Railway.app / Render.com
- **Database**: Railway PostgreSQL / Neon
- **Redis**: Upstash (free tier)
- **Frontend**: Vercel / Netlify

---

## Next Steps
1. Set up project structure
2. Create base configuration files
3. Implement broker adapters
4. Build pattern detection engine
5. Create API server
6. Build WebSocket server
7. Develop frontend dashboard
8. Integration testing
9. Deployment

