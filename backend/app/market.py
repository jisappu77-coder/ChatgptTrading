from __future__ import annotations

import asyncio
import os
from typing import Any

import httpx

BINANCE_API_BASE = os.getenv("BINANCE_API_BASE", "https://api.binance.com").rstrip("/")
DEFAULT_SYMBOLS = ("BTCUSDT", "ETHUSDT", "BNBUSDT", "XRPUSDT", "SOLUSDT")


async def _get(path: str, params: dict[str, Any] | None = None) -> Any:
    timeout = httpx.Timeout(10.0)
    async with httpx.AsyncClient(base_url=BINANCE_API_BASE, timeout=timeout) as client:
        response = await client.get(path, params=params)
        response.raise_for_status()
        return response.json()


async def get_ticker(symbol: str) -> dict[str, Any]:
    data = await _get("/api/v3/ticker/24hr", {"symbol": symbol.upper()})
    return {
        "symbol": data["symbol"],
        "price": float(data["lastPrice"]),
        "change_24h_pct": float(data["priceChangePercent"]),
        "volume_base_24h": float(data["volume"]),
        "volume_quote_24h": float(data["quoteVolume"]),
        "high_24h": float(data["highPrice"]),
        "low_24h": float(data["lowPrice"]),
    }


async def get_top_markets() -> list[dict[str, Any]]:
    # MVP universe: the five large-cap non-stablecoins used by the scanner.
    # A later universe service can replace this with dynamic market-cap ranking.
    results = await asyncio.gather(*(get_ticker(symbol) for symbol in DEFAULT_SYMBOLS))
    return list(results)


async def get_klines(symbol: str, interval: str = "15m", limit: int = 250) -> list[dict[str, Any]]:
    safe_limit = min(max(limit, 50), 1000)
    raw = await _get(
        "/api/v3/klines",
        {"symbol": symbol.upper(), "interval": interval, "limit": safe_limit},
    )

    candles: list[dict[str, Any]] = []
    for row in raw:
        candles.append(
            {
                "open_time": int(row[0]),
                "open": float(row[1]),
                "high": float(row[2]),
                "low": float(row[3]),
                "close": float(row[4]),
                "volume": float(row[5]),
                "close_time": int(row[6]),
                "quote_volume": float(row[7]),
                "trades": int(row[8]),
            }
        )
    return candles
