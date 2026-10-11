# Bank247 Staff UI

Production staff frontend for Bank247 CBS (React + Vite + TypeScript).

## Stack

- React 19, Vite 8, TypeScript
- React Router, Framer Motion
- Keycloak password grant (local) / JWT `bank_id` + permissions
- Tenant host: `{slug}.bank247.com` (Cloud) after shared login

## Develop

```bash
# Backend gateway (from bank247-backend-java)
cd ../bank247-backend-java/local-dev
docker compose -f docker-compose.integration.yml up -d api-gateway

# Frontend
cd ../../bank247-frontend-react
cp .env.example .env.local
npm install
npm run dev
```

Open http://localhost:5173 — **all design-reference modules are routed** in the unified sidebar (customer ops, branch/cash, GL, contracts, reports, IAM, branding).

Vite proxies `/api` and `/realms` to the nginx gateway (`http://localhost:8080`), so login works without browser CORS issues. Keep `VITE_API_BASE_URL` empty in `.env.local` for local dev.

Live API wiring today: login, customer list/create/detail, IAM users/roles catalog, workflow approvals. Other list screens match Figma layouts and call through the gateway as you deepen each module.

## Design reference

Figma PNG exports live under `design-reference/` (not part of the build).
