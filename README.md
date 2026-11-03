# Perps Funding Pulse

**Bounty:** [daydreamsai/agent-bounties#8](https://github.com/daydreamsai/agent-bounties/issues/8) — **$1,000**

Live HTTPS (Cloudflare quick tunnel from box, keep process up):
`https://dir-disc-profiles-templates.trycloudflare.com`

- `GET /health` → 200
- `POST /entrypoints/funding-pulse/invoke` unpaid → **HTTP 402** (x402), payTo `0xDFb67e2ed78F174e76Cf5Cfc87Ab39733f7a5c62`

## Stack
- Node ≥ 20, TypeScript, `tsx`
- `@lucid-dreams/agent-kit` + Zod + Hono
- Venues: Hyperliquid, Binance, Bybit

## Run
```bash
npm install
ADDRESS=0xDFb67e2ed78F174e76Cf5Cfc87Ab39733f7a5c62 NETWORK=base-sepolia DEFAULT_PRICE=0.01 npm start
```

## Env
| Var | Notes |
|---|---|
| ADDRESS / PAY_TO | x402 pay-to (enables paywall) |
| NETWORK | e.g. base-sepolia / base |
| DEFAULT_PRICE | default 0.01 USDC |
| FACILITATOR_URL | https://facilitator.daydreams.systems |
| PORT | 8787 |
