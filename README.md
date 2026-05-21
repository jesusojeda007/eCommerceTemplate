# E-commerce Template

A production-ready, client-customizable e-commerce template.

## Stack

- **Next.js** (App Router) + TypeScript
- **Tailwind CSS** + shadcn/ui
- **PostgreSQL** (Docker) + Prisma 7
- **Zustand** for cart state
- **NextAuth v4** for authentication

## Features

- Product catalog with category filters and search
- Product detail pages with volume discount display
- Cart with coupon codes and volume discounts
- Pluggable checkout: WhatsApp redirect, QR payment, or custom platform
- Auth: login and register with email/password
- Single `client.config.ts` for all per-client customization

## Quick start

```bash
cp .env.example .env         # fill in your values
docker compose up -d         # start PostgreSQL
npx prisma migrate dev       # apply schema
npx prisma db seed           # load sample data
npm run dev                  # http://localhost:3000
```

Demo: `demo@example.com` / `password123`

## Customization

See [docs/CUSTOMIZATION.md](docs/CUSTOMIZATION.md) for a step-by-step guide.

AI assistants: see [CLAUDE.md](CLAUDE.md) for how to work with this codebase.
