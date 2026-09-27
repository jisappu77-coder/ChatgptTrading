# ChatgptTrading

Scenario-based intraday crypto scanner MVP.

## GitHub Pages

The frontend is configured for static hosting on GitHub Pages:

**https://jisappu77-coder.github.io/ChatgptTrading/**

The Pages version fetches public Binance market data directly in the browser and performs
the current EMA / RSI / ATR / relative-volume breakout analysis client-side. No API key
or backend server is required for the hosted dashboard.

GitHub Pages is static hosting, so the FastAPI service remains in the repository for
future server-side features such as WebSockets, authenticated exchange integrations,
databases, alert workers and AI-generated reports.

## What is included

- Top-5 market dashboard for BTC, ETH, BNB, XRP and SOL
- Public Binance spot market data (no API key required)
- Static GitHub Pages frontend
- 5m / 15m / 1h / 4h / 1d FastAPI candle endpoints for future server deployments
- EMA 20/50/200, RSI 14, ATR 14 and relative-volume calculations
- Deterministic breakout-watch / confirmed / no-setup states
- Support, resistance, confirmation, entry-zone, invalidation and TP levels
- Annotated 15-minute candlestick visualization
- Next.js/TypeScript frontend + FastAPI backend
- Docker Compose local environment
- GitHub Actions CI and Pages deployment

## Architecture

```text
GitHub Pages hosted mode
------------------------
Browser
  |
  +--> Binance public market-data API
  |
  +--> TypeScript indicator + breakout engine
  |
  +--> static Next.js dashboard


Future server mode
------------------
Exchange feeds
   |
   v
FastAPI / WebSocket services
   |
   +--> analysis / alerts / persistence
   |
   v
Web or mobile clients
```

## Run frontend locally

```bash
cd frontend
npm install
npm run dev
```

Open http://localhost:3000.

## Run backend locally

```bash
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

API docs: http://localhost:8000/docs

## Run with Docker

```bash
docker compose up --build
```

## API examples

```text
GET /api/markets/top
GET /api/market/BTCUSDT/klines?interval=15m&limit=120
GET /api/analysis/BTCUSDT?interval=15m
```

## Important

This application provides scenario-based market analysis only. A breakout is not
treated as confirmed merely because price touches resistance. The current scanner
requires a close above the calculated confirmation level with relative-volume support
and presents retest/invalidation levels for risk definition.

It does not place orders and does not guarantee trading outcomes.
