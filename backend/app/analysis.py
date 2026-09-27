from __future__ import annotations

from typing import Any

import pandas as pd


def _rsi(close: pd.Series, period: int = 14) -> float:
    delta = close.diff()
    gain = delta.clip(lower=0).ewm(alpha=1 / period, adjust=False).mean()
    loss = (-delta.clip(upper=0)).ewm(alpha=1 / period, adjust=False).mean()
    denominator = loss.iloc[-1]
    if denominator == 0:
        return 100.0
    rs = gain.iloc[-1] / denominator
    return float(100 - (100 / (1 + rs)))


def _atr(frame: pd.DataFrame, period: int = 14) -> float:
    previous_close = frame["close"].shift(1)
    true_range = pd.concat(
        [
            frame["high"] - frame["low"],
            (frame["high"] - previous_close).abs(),
            (frame["low"] - previous_close).abs(),
        ],
        axis=1,
    ).max(axis=1)
    return float(true_range.ewm(alpha=1 / period, adjust=False).mean().iloc[-1])


def analyze_candles(symbol: str, interval: str, candles: list[dict[str, Any]]) -> dict[str, Any]:
    if len(candles) < 60:
        raise ValueError("At least 60 candles are required for analysis.")

    frame = pd.DataFrame(candles)
    close = frame["close"]

    ema20 = float(close.ewm(span=20, adjust=False).mean().iloc[-1])
    ema50 = float(close.ewm(span=50, adjust=False).mean().iloc[-1])
    ema200 = (
        float(close.ewm(span=200, adjust=False).mean().iloc[-1])
        if len(close) >= 200
        else None
    )
    rsi14 = _rsi(close)
    atr14 = _atr(frame)

    latest = frame.iloc[-1]
    prior = frame.iloc[:-1]
    lookback = prior.tail(20)
    resistance = float(lookback["high"].max())
    support = float(lookback["low"].min())
    avg_volume20 = float(prior["volume"].tail(20).mean())
    current_volume = float(latest["volume"])
    volume_ratio = current_volume / avg_volume20 if avg_volume20 else 0.0

    current_price = float(latest["close"])
    if current_price > ema20 > ema50:
        structure = "bullish"
    elif current_price < ema20 < ema50:
        structure = "bearish"
    else:
        structure = "range_or_transition"

    breakout_buffer = max(atr14 * 0.08, resistance * 0.0005)
    if current_price > resistance + breakout_buffer and volume_ratio >= 1.15:
        state = "CONFIRMED"
    elif current_price >= resistance - breakout_buffer:
        state = "BREAKOUT_WATCH"
    else:
        state = "NO_SETUP"

    entry_low = resistance
    entry_high = resistance + atr14 * 0.20
    invalidation = resistance - atr14 * 1.05
    tp1 = resistance + atr14 * 1.0
    tp2 = resistance + atr14 * 2.0
    tp3 = resistance + atr14 * 3.0

    return {
        "symbol": symbol.upper(),
        "interval": interval,
        "timestamp_ms": int(latest["close_time"]),
        "price": current_price,
        "structure": structure,
        "state": state,
        "indicators": {
            "ema20": ema20,
            "ema50": ema50,
            "ema200": ema200,
            "rsi14": rsi14,
            "atr14": atr14,
            "volume_vs_20_avg": volume_ratio,
        },
        "levels": {
            "support": support,
            "resistance": resistance,
            "breakout_confirmation": resistance + breakout_buffer,
            "entry_zone": [entry_low, entry_high],
            "invalidation": invalidation,
            "tp1": tp1,
            "tp2": tp2,
            "tp3": tp3,
        },
        "conditions": {
            "long_confirmation": [
                "Candle closes above breakout confirmation.",
                "Breakout volume is at least 1.15x the prior 20-candle average.",
                "Retest holds the former resistance as support before entry.",
            ],
            "no_trade": [
                "Price only wicks above resistance and closes back below it.",
                "Retest loses the invalidation level.",
                "Breakout occurs without volume confirmation.",
            ],
        },
    }
