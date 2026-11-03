/**
 * Perps Funding Pulse — local scaffold for daydreamsai/agent-bounties#8 ($1000).
 * Acceptance: live funding_rate, time_to_next, open_interest, skew; must be
 * deployed on a domain reachable via x402; submit as PR into agent-bounties.
 * BLOCKED for submit: gh not authenticated; x402 domain not deployed.
 */
import { z } from "zod";

export type VenueId = "binance" | "bybit" | "hyperliquid";

export interface FundingPulse {
  venue_id: VenueId;
  market: string;
  funding_rate: number;
  time_to_next_ms: number;
  open_interest: number | null;
  skew: number | null;
  as_of_ms: number;
  source: string;
}

const inputSchema = z.object({
  venue_ids: z.array(z.enum(["binance", "bybit", "hyperliquid"])).default(["binance", "bybit", "hyperliquid"]),
  markets: z.array(z.string()).default(["BTCUSDT", "ETHUSDT"]),
});

async function fetchJson(url: string): Promise<any> {
  const res = await fetch(url, { headers: { Accept: "application/json", "User-Agent": "perps-funding-pulse/0.1" } });
  if (!res.ok) throw new Error(`${url} -> ${res.status}`);
  return res.json();
}

export async function binanceFunding(market: string): Promise<FundingPulse> {
  const sym = market.replace(/[^A-Z0-9]/gi, "").toUpperCase();
  const [prem, oi] = await Promise.all([
    fetchJson(`https://fapi.binance.com/fapi/v1/premiumIndex?symbol=${sym}`),
    fetchJson(`https://fapi.binance.com/fapi/v1/openInterest?symbol=${sym}`).catch(() => null),
  ]);
  const now = Date.now();
  const next = Number(prem.nextFundingTime || 0);
  return {
    venue_id: "binance",
    market: sym,
    funding_rate: Number(prem.lastFundingRate),
    time_to_next_ms: Math.max(0, next - now),
    open_interest: oi ? Number(oi.openInterest) : null,
    skew: null,
    as_of_ms: now,
    source: "binance-fapi",
  };
}

export async function bybitFunding(market: string): Promise<FundingPulse> {
  const sym = market.replace(/[^A-Z0-9]/gi, "").toUpperCase();
  const tick = await fetchJson(`https://api.bybit.com/v5/market/tickers?category=linear&symbol=${sym}`);
  const row = (tick?.result?.list || [])[0] || {};
  const now = Date.now();
  const next = Number(row.nextFundingTime || 0);
  return {
    venue_id: "bybit",
    market: sym,
    funding_rate: Number(row.fundingRate || 0),
    time_to_next_ms: Math.max(0, next - now),
    open_interest: row.openInterest != null ? Number(row.openInterest) : null,
    skew: null,
    as_of_ms: now,
    source: "bybit-v5",
  };
}

export async function hyperliquidFunding(market: string): Promise<FundingPulse> {
  // Hyperliquid meta+assetCtxs
  const body = JSON.stringify({ type: "metaAndAssetCtxs" });
  const res = await fetch("https://api.hyperliquid.xyz/info", {
    method: "POST",
    headers: { "Content-Type": "application/json", "User-Agent": "perps-funding-pulse/0.1" },
    body,
  });
  if (!res.ok) throw new Error(`hl ${res.status}`);
  const data = await res.json();
  const meta = data[0]?.universe || [];
  const ctxs = data[1] || [];
  const want = market.replace(/USDT$/i, "").replace(/-PERP$/i, "").toUpperCase();
  const idx = meta.findIndex((m: any) => String(m.name).toUpperCase() === want);
  if (idx < 0) throw new Error(`hl market not found: ${market}`);
  const ctx = ctxs[idx] || {};
  const now = Date.now();
  // HL funding is hourly; approximate next hour boundary
  const nextHour = Math.ceil(now / 3_600_000) * 3_600_000;
  return {
    venue_id: "hyperliquid",
    market: want,
    funding_rate: Number(ctx.funding || 0),
    time_to_next_ms: Math.max(0, nextHour - now),
    open_interest: ctx.openInterest != null ? Number(ctx.openInterest) : null,
    skew: null,
    as_of_ms: now,
    source: "hyperliquid-info",
  };
}

export async function runPulse(raw: unknown): Promise<{ results: FundingPulse[] }> {
  const input = inputSchema.parse(raw ?? {});
  const out: FundingPulse[] = [];
  for (const venue of input.venue_ids) {
    for (const m of input.markets) {
      try {
        if (venue === "binance") out.push(await binanceFunding(m));
        else if (venue === "bybit") out.push(await bybitFunding(m));
        else if (venue === "hyperliquid") out.push(await hyperliquidFunding(m));
      } catch (e: any) {
        out.push({
          venue_id: venue,
          market: m,
          funding_rate: NaN,
          time_to_next_ms: 0,
          open_interest: null,
          skew: null,
          as_of_ms: Date.now(),
          source: `error:${e?.message || e}`,
        });
      }
    }
  }
  return { results: out };
}

// CLI smoke
if (import.meta.url === `file://${process.argv[1]}` || process.argv[1]?.endsWith("index.ts") || process.argv[1]?.endsWith("index.js")) {
  runPulse({}).then((r) => {
    console.log(JSON.stringify(r, null, 2));
  }).catch((e) => {
    console.error(e);
    process.exit(1);
  });
}
