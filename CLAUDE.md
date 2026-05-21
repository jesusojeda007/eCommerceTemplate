# CLAUDE.md — E-commerce Template

This file tells AI assistants (Claude, Copilot, etc.) how to work with this template.

## What this project is

A Next.js + TypeScript e-commerce template. Cloned once per client, customized via `client.config.ts`.
Stack: Next.js App Router, TypeScript, Tailwind, shadcn/ui, PostgreSQL (Docker port 5437), Prisma 7, Zustand, NextAuth v4.

## Starting local development

1. `docker compose up -d`          — start PostgreSQL (port 5437)
2. `npx prisma migrate dev`         — apply migrations
3. `npx prisma db seed`             — load sample data
4. `npm run dev`                    — start Next.js at http://localhost:3000

Demo credentials: demo@example.com / password123

## Customizing for a new client

Edit ONE file: `client.config.ts`

| Field | Effect |
|---|---|
| `name`, `tagline` | Site title and subtitle |
| `theme.primary` | Main brand color (hex) |
| `theme.font` | Google Font name |
| `whatsapp.number` | WhatsApp number for orders |
| `checkout.mode` | `"whatsapp"`, `"qr"`, or `"payment"` |
| `discounts.couponsEnabled` | Show/hide coupon input in cart |
| `features.auth` | Show/hide login/register |

Replace files in `public/client/`: `logo.png`, `favicon.ico`, `qr-pago.png`.

## Files you MUST NOT change without understanding them

- `prisma/schema.prisma` — changing models requires a new migration (`npx prisma migrate dev --name your-change`)
- `src/lib/data/types.ts` — breaking these types breaks everything
- `src/lib/checkout/types.ts` — `CheckoutAdapter` interface contract
- `src/lib/store/cart.ts` — discount logic is tested; edit carefully

## Adding a new checkout payment method

1. Create `src/lib/checkout/your-method.ts` implementing `CheckoutAdapter` (see `src/lib/checkout/types.ts`)
2. Add a `case` in `src/lib/checkout/index.ts`
3. Add the new mode to `ClientConfig.checkout.mode` union in `client.config.ts`

## Adding a new Prisma model

1. Add model to `prisma/schema.prisma`
2. Run `npx prisma migrate dev --name your-model`
3. Add types to `src/lib/data/types.ts`
4. Create `src/lib/data/your-model.ts` with query functions
5. Import Prisma via `src/lib/db.ts` (never instantiate PrismaClient directly in components)

## Common tasks

**Change brand color:** Edit `theme.primary` in `client.config.ts`

**Switch to QR checkout:**
```typescript
checkout: {
  mode: 'qr',
  qr: { imageUrl: '/client/qr-pago.png', instructions: 'Escanea y manda comprobante' }
}
```

**Add a coupon:** Use Prisma Studio (`npx prisma studio`) or add to `prisma/seed.ts` and re-seed

**Add seed products:** Edit `prisma/seed.ts` and run `npx prisma db seed`

**Disable auth:** Set `features.auth: false` in `client.config.ts`

## Running tests

```bash
npm test            # run all tests
npm run test:watch  # watch mode
```

## Architecture notes

- Data access: always use functions from `src/lib/data/` — never import Prisma directly in components
- Cart state: Zustand store at `src/lib/store/cart.ts`, persisted to localStorage
- Checkout: plugin system at `src/lib/checkout/` — adapter selected by `config.checkout.mode`
- Discounts: volume discounts computed in cart store; coupons validated via `/api/coupon/validate`
- Auth: NextAuth v4 credentials provider — user table in PostgreSQL
