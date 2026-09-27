from app.analysis import analyze_candles


def _candles(count: int = 250):
    rows = []
    for i in range(count):
        base = 80_000 + (i * 10)
        rows.append(
            {
                "open_time": i * 60_000,
                "open": base,
                "high": base + 120,
                "low": base - 80,
                "close": base + 40,
                "volume": 100 + i,
                "close_time": (i + 1) * 60_000 - 1,
                "quote_volume": 0,
                "trades": 100,
            }
        )
    return rows


def test_analysis_returns_required_levels():
    result = analyze_candles("BTCUSDT", "15m", _candles())

    assert result["symbol"] == "BTCUSDT"
    assert result["structure"] in {"bullish", "bearish", "range_or_transition"}
    assert result["state"] in {"CONFIRMED", "BREAKOUT_WATCH", "NO_SETUP"}
    assert result["levels"]["support"] < result["levels"]["resistance"]
    assert result["levels"]["invalidation"] < result["levels"]["entry_zone"][0]
