#!/usr/bin/env python3
"""Live venue smoke — only endpoints that must pass from this box."""
import json, urllib.request, ssl, sys
ctx = ssl.create_default_context()
UA = {"User-Agent": "Mozilla/5.0 perps-funding-pulse/0.1", "Accept": "application/json"}

def get(url, data=None):
    req = urllib.request.Request(
        url, data=data,
        headers={**UA, **({"Content-Type": "application/json"} if data else {})},
        method="POST" if data else "GET",
    )
    with urllib.request.urlopen(req, context=ctx, timeout=25) as r:
        return r.status, json.loads(r.read())

passed, failed, optional = [], [], []

# REQUIRED
try:
    st, j = get("https://www.okx.com/api/v5/public/funding-rate?instId=BTC-USDT-SWAP")
    assert st == 200 and j.get("code") == "0" and j.get("data")
    passed.append("okx")
except Exception as e:
    failed.append({"okx": str(e)[:120]})

try:
    st, j = get("https://api.hyperliquid.xyz/info", json.dumps({"type": "metaAndAssetCtxs"}).encode())
    assert st == 200 and isinstance(j, list) and len(j) >= 2
    passed.append("hyperliquid")
except Exception as e:
    failed.append({"hyperliquid": str(e)[:120]})

try:
    st, j = get("https://indexer.dydx.trade/v4/perpetualMarkets")
    assert st == 200 and "BTC-USD" in (j.get("markets") or {})
    passed.append("dydx")
except Exception as e:
    failed.append({"dydx": str(e)[:120]})

try:
    st, j = get("https://api.gateio.ws/api/v4/futures/usdt/contracts/BTC_USDT")
    assert st == 200 and (j.get("funding_rate") is not None or j.get("funding_rate_indicative") is not None)
    passed.append("gate")
except Exception as e:
    failed.append({"gate": str(e)[:120]})

# OPTIONAL (geo-flaky)
try:
    st, j = get("https://fapi.binance.com/fapi/v1/premiumIndex?symbol=BTCUSDT")
    assert st == 200 and j.get("lastFundingRate") is not None
    optional.append("binance_ok")
except Exception as e:
    optional.append(f"binance_skip:{type(e).__name__}")

ok = len(failed) == 0 and len(passed) >= 3
out = {"ok": ok, "passed": passed, "failed": failed, "optional": optional, "pass_count": f"{len(passed)}/{len(passed)+len(failed)}"}
print(json.dumps(out, indent=2))
sys.exit(0 if ok else 1)
