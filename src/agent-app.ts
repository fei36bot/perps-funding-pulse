/**
 * Agent-kit wired HTTP app for Perps Funding Pulse (daydreamsai #8).
 * x402 paywall on invoke/stream via payments config (ADDRESS/DEFAULT_PRICE).
 */
import { z } from "zod";
import { createAgentApp, paymentsFromEnv } from "@lucid-dreams/agent-kit";
import { runPulse } from "./index.js";

const payments = paymentsFromEnv({ defaultPrice: process.env.DEFAULT_PRICE || "0.01" });

const { app, addEntrypoint } = createAgentApp(
  {
    name: "perps-funding-pulse",
    version: "0.1.0",
    description: "Fetch current funding rate and open interest for perps markets",
  },
  {
    payments,
  }
);

addEntrypoint({
  key: "funding-pulse",
  description: "Return live funding_rate, time_to_next, open_interest, skew for venues/markets",
  input: z.object({
    venue_ids: z
      .array(z.enum(["binance", "bybit", "hyperliquid"]))
      .default(["binance", "bybit", "hyperliquid"]),
    markets: z.array(z.string()).default(["BTCUSDT", "ETHUSDT"]),
  }),
  price: process.env.DEFAULT_PRICE || "0.01",
  async handler({ input }) {
    const { results } = await runPulse(input);
    // Map to acceptance field names
    const mapped = results.map((r) => ({
      venue_id: r.venue_id,
      market: r.market,
      funding_rate: r.funding_rate,
      time_to_next: r.time_to_next_ms,
      open_interest: r.open_interest,
      skew: r.skew,
      as_of_ms: r.as_of_ms,
      source: r.source,
    }));
    return {
      output: { results: mapped },
      usage: { total_tokens: mapped.length },
    };
  },
});

addEntrypoint({
  key: "echo",
  description: "Echo a message",
  input: z.object({ text: z.string() }),
  price: process.env.DEFAULT_PRICE || "0.01",
  async handler({ input }) {
    return {
      output: { text: String(input.text ?? "") },
      usage: { total_tokens: String(input.text ?? "").length },
    };
  },
});

export default app;
export { app };
