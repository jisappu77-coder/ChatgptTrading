from __future__ import annotations

from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from httpx import HTTPError

from .analysis import analyze_candles
from .market import DEFAULT_SYMBOLS, get_klines, get_top_markets

app = FastAPI(
    title="ChatgptTrading API",
    version="0.1.0",
    description="Public-market-data API for the intraday crypto scanner MVP.",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=False,
    allow_methods=["GET"],
    allow_headers=["*"],
)

ALLOWED_INTERVALS = {"5m", "15m", "1h", "4h", "1d"}


def _validate_symbol(symbol: str) -> str:
    normalized = symbol.upper()
    if normalized not in DEFAULT_SYMBOLS:
        raise HTTPException(status_code=400, detail="Symbol is outside the MVP scanner universe.")
    return normalized


@app.get("/health")
async def health() -> dict[str, str]:
    return {"status": "ok"}


@app.get("/api/markets/top")
async def markets_top():
    try:
        return {"markets": await get_top_markets()}
    except HTTPError as exc:
        raise HTTPException(status_code=502, detail=f"Market-data provider error: {exc}") from exc


@app.get("/api/market/{symbol}/klines")
async def market_klines(
    symbol: str,
    interval: str = Query(default="15m"),
    limit: int = Query(default=120, ge=50, le=500),
):
    normalized = _validate_symbol(symbol)
    if interval not in ALLOWED_INTERVALS:
        raise HTTPException(status_code=400, detail="Unsupported interval.")
    try:
        candles = await get_klines(normalized, interval=interval, limit=limit)
        return {"symbol": normalized, "interval": interval, "candles": candles}
    except HTTPError as exc:
        raise HTTPException(status_code=502, detail=f"Market-data provider error: {exc}") from exc


@app.get("/api/analysis/{symbol}")
async def market_analysis(
    symbol: str,
    interval: str = Query(default="15m"),
):
    normalized = _validate_symbol(symbol)
    if interval not in ALLOWED_INTERVALS:
        raise HTTPException(status_code=400, detail="Unsupported interval.")
    try:
        candles = await get_klines(normalized, interval=interval, limit=250)
        return analyze_candles(normalized, interval, candles)
    except HTTPError as exc:
        raise HTTPException(status_code=502, detail=f"Market-data provider error: {exc}") from exc
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc
