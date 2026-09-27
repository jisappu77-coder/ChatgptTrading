# ChatgptTrading

Scenario-based intraday crypto scanner MVP.

## What is included

- Top-5 market dashboard for BTC, ETH, BNB, XRP and SOL
- Public Binance spot market data (no API key required)
- 5m / 15m / 1h / 4h / 1d backend candle endpoints
- EMA 20/50/200, RSI 14, ATR 14 and relative-volume calculations
- Deterministic breakout-watch / confirmed / no-setup states
- Support, resistance, confirmation, entry-zone, invalidation and TP levels
- Annotated 15-minute candlestick visualization
- FastAPI backend + Next.js/TypeScript frontend
- Docker Compose local environment
- GitHub Actions backend tests and frontend build checks

## Architecture

```text
Exchange REST (MVP)
       |
       v
FastAPI market service
       |
       +--> indicator / breakout analysis
       |
       v
REST API
       |
       v
Next.js dashboard
       |
       +--> top-5 scanner
       +--> candle chart
       +--> breakout plan
```

The MVP keeps analysis deterministic. An AI explanation layer, WebSocket streaming,
Redis, PostgreSQL, alerts, derivatives data and trade journaling can be added after
the core scanner is validated.

## Run with Docker

```bash
cp .env.example .env
docker compose up --build
```

Then open:

- Frontend: http://localhost:3000
- API docs: http://localhost:8000/docs
- Health: http://localhost:8000/health

## Run backend locally

```bash
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

## Run frontend locally

```bash
cd frontend
npm install
npm run dev
```

## API examples

```text
GET /api/markets/top
GET /api/market/BTCUSDT/klines?interval=15m&limit=120
GET /api/analysis/BTCUSDT?interval=15m
```

## Important

This application provides scenario-based market analysis only. A breakout is not
treated as confirmed merely because price touches resistance. The current MVP
requires a close above the calculated confirmation level with relative-volume
support and presents retest/invalidation levels for risk definition.

It does not place orders and does not guarantee trading outcomes.
