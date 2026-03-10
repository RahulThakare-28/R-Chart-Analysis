# ChartScanAI - Requirements & Dependencies

## System Requirements
- **Node.js**: 18.x or higher
- **npm**: 9.x or higher (or yarn, pnpm)
- **Git**: Latest version
- **RAM**: Minimum 2GB (4GB recommended)
- **Disk**: Minimum 500MB

## Runtime Dependencies

### Root Level
```json
{
  "devDependencies": {
    "typescript": "^5.0.0",
    "turbo": "^1.10.0",
    "@typescript-eslint/eslint-plugin": "^6.0.0",
    "@typescript-eslint/parser": "^6.0.0",
    "eslint": "^8.0.0",
    "prettier": "^3.0.0",
    "husky": "^8.0.0",
    "lint-staged": "^15.0.0"
  }
}
```

### Core Package Dependencies

#### `packages/core`
```json
{
  "dependencies": {
    "dotenv": "^16.0.0",
    "axios": "^1.6.0",
    "node-cache": "^5.1.0",
    "winston": "^3.11.0",
    "joi": "^17.11.0"
  },
  "devDependencies": {
    "jest": "^29.0.0",
    "@types/jest": "^29.0.0",
    "@types/node": "^20.0.0"
  }
}
```

#### `packages/shared`
```json
{
  "dependencies": {
    "class-validator": "^0.14.0",
    "class-transformer": "^0.5.0"
  }
}
```

#### `packages/config`
```json
{
  "dependencies": {
    "dotenv": "^16.0.0",
    "convict": "^6.2.0"
  }
}
```

### API App Dependencies

#### `apps/api`
```json
{
  "dependencies": {
    "express": "^4.18.0",
    "cors": "^2.8.0",
    "helmet": "^7.0.0",
    "morgan": "^1.10.0",
    "express-async-errors": "^3.1.0",
    "compression": "^1.7.0",
    "pg": "^8.11.0",
    "@core": "workspace:*",
    "@shared": "workspace:*",
    "@config": "workspace:*"
  },
  "devDependencies": {
    "supertest": "^6.3.0",
    "jest": "^29.0.0"
  }
}
```

### WebSocket Server Dependencies

#### `apps/websocket-server`
```json
{
  "dependencies": {
    "socket.io": "^4.7.0",
    "socket.io-client": "^4.7.0",
    "redis": "^4.6.0",
    "@core": "workspace:*",
    "@shared": "workspace:*"
  }
}
```

### Web Frontend Dependencies

#### `apps/web`
```json
{
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "zustand": "^4.4.0",
    "axios": "^1.6.0",
    "socket.io-client": "^4.7.0",
    "lightweight-charts": "^4.1.0",
    "chart.js": "^4.4.0",
    "react-chartjs-2": "^5.2.0",
    "tailwindcss": "^3.3.0",
    "react-router-dom": "^6.20.0",
    "react-hot-toast": "^2.4.0"
  },
  "devDependencies": {
    "vite": "^5.0.0",
    "@vitejs/plugin-react": "^4.2.0",
    "vitest": "^1.1.0",
    "@testing-library/react": "^14.1.0"
  }
}
```

## Free API Integration Keys

### 1. Grow.co.in
- **Signup**: https://grow.co.in
- **Free Tier**: Limited quotes/day
- **Authentication**: API Key
- **Endpoints**: Quote, Historical data, Holdings

### 2. Upstox
- **Signup**: https://upstox.com
- **Free Tier**: WebSocket streaming
- **Authentication**: OAuth 2.0
- **Endpoints**: Market data, Historical data, Order placement

### 3. Ticker Tape
- **Signup**: https://www.tickertape.in
- **Free Tier**: API access with rate limits
- **Authentication**: API Key
- **Endpoints**: Market data, Charts, Screeners

## Database Options (Free Tier)

### PostgreSQL (Recommended)
```
Provider: Railway.app / Neon / Supabase
Free DB: ~5GB
Connection: Standard PostgreSQL connection string
```

### SQLite (Local)
```
Provider: Local file-based
Recommended for: Development and small deployments
Setup: No external setup needed
```

## Caching Options (Free)

### Redis (Recommended)
```
Provider: Upstash Redis / Railway Redis
Free Tier: 10,000 commands/day
Alternative: Local Redis instance
```

### File Cache (Fallback)
```
Provider: Node.js fs module
Location: ./cache/ directory
TTL: Implemented manually
```

## Optional Services (Free Tier)

### Monitoring & Logging
- **OpenTelemetry**: Free open-source
- **Datadog**: Free tier available
- **Grafana**: Free open-source

### Hosting
- **Railway.app**: $5/month free tier
- **Render.com**: Free tier available (limited)
- **Vercel**: Free for frontend
- **Netlify**: Free for frontend

## Development Tools (All Free)

- **Version Control**: Git + GitHub
- **Code Editor**: VS Code (free)
- **Testing**: Jest + Vitest (free)
- **Documentation**: Markdown (free)
- **API Testing**: Postman / Insomnia (free)

## Installation Instructions

### 1. Clone Repository
```bash
git clone https://github.com/yourusername/ChartScanAI.git
cd ChartScanAI
```

### 2. Install Dependencies
```bash
npm install
# or
yarn install
# or
pnpm install
```

### 3. Setup Environment
```bash
# Copy template
cp config/.env.example .env.development

# Add your API keys
# Edit config/api-keys.json with your credentials
```

### 4. Setup Database (Optional)
```bash
# For PostgreSQL
npm run migrate:postgres

# For SQLite (auto-created)
npm run migrate:sqlite
```

### 5. Run Project
```bash
# Uses turbo for monorepo orchestration
./scripts/start.sh dev
```

## Performance Targets

- **API Response Time**: < 200ms
- **WebSocket Latency**: < 100ms
- **Pattern Detection**: < 500ms per symbol
- **Memory Usage**: < 500MB baseline
- **Database Query**: < 100ms
- **Cache Hit Rate**: > 80%

## Security Requirements

- HTTPS/TLS in production
- API rate limiting (100 req/min per IP)
- Input validation on all endpoints
- Environment variable protection
- Secure storage of API keys
- CORS enabled only for trusted domains
- Helmet.js for HTTP headers security

## Scalability Considerations

- **Horizontal Scaling**: Stateless API design
- **Load Balancing**: Nginx / HAProxy
- **Database Connection Pooling**: pg-pool
- **Message Queue**: BullMQ for background jobs
- **Caching Strategy**: Multi-tier (Redis → File → DB)
- **Database Sharding**: By symbol (future)

## Compliance & Legal

- Data Privacy: GDPR compliant data handling
- Financial Disclaimer: Clear disclaimer on accuracy
- Terms of Service: User agreement for usage
- Broker API Terms: Respect all broker TOS

