import { test } from "node:test";
import assert from "node:assert/strict";
const UA = { "User-Agent": "Mozilla/5.0 perps-funding-pulse/0.1", Accept: "application/json" };

test("okx funding-rate BTC-USDT-SWAP live", async () => {
  const res = await fetch("https://www.okx.com/api/v5/public/funding-rate?instId=BTC-USDT-SWAP", { headers: UA });
  assert.equal(res.status, 200);
  const j = await res.json();
  assert.equal(j.code, "0");
  assert.ok((j.data || []).length >= 1);
});

test("hyperliquid metaAndAssetCtxs live", async () => {
  const res = await fetch("https://api.hyperliquid.xyz/info", {
    method: "POST",
    headers: { ...UA, "Content-Type": "application/json" },
    body: JSON.stringify({ type: "metaAndAssetCtxs" }),
  });
  assert.equal(res.status, 200);
  const j = await res.json();
  assert.ok(Array.isArray(j) && j.length >= 2);
});

test("dydx perpetualMarkets live", async () => {
  const res = await fetch("https://indexer.dydx.trade/v4/perpetualMarkets", { headers: UA });
  assert.equal(res.status, 200);
  const j = await res.json();
  assert.ok(j.markets && j.markets["BTC-USD"]);
});

test("gate BTC_USDT futures contract live", async () => {
  const res = await fetch("https://api.gateio.ws/api/v4/futures/usdt/contracts/BTC_USDT", { headers: UA });
  assert.equal(res.status, 200);
  const j = await res.json();
  assert.ok(j.funding_rate != null || j.funding_rate_indicative != null);
});
