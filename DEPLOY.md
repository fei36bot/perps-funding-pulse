# Durable deploy

## Fly.io (preferred once token exists)
```bash
export FLY_API_TOKEN=...   # from https://fly.io/user/personal_access_tokens
fly apps create fei36-perps-funding-pulse
fly secrets set ADDRESS=0xDFb67e2ed78F174e76Cf5Cfc87Ab39733f7a5c62 NETWORK=base-sepolia DEFAULT_PRICE=0.01
fly deploy --remote-only
```
URL: https://fei36-perps-funding-pulse.fly.dev

## Render
Connect GitHub repo → Blueprint `render.yaml` → set secret ADDRESS → Deploy.
URL: https://fei36-perps-funding-pulse.onrender.com

## Blocker on Grok Bot box (2026-11-03)
No FLY_API_TOKEN / RENDER_API_KEY in env or secrets. `fly auth login --email` requires password.
This executor has no Vault / browser computerUse tools to complete signup without a user popup.
