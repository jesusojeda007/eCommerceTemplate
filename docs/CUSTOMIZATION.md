# Customization Guide

## Quick start for a new client

1. Clone this repo
2. Edit `client.config.ts` with client details (name, colors, WhatsApp, checkout mode)
3. Replace `public/client/logo.png` with client logo (square, min 200×200px)
4. Replace `public/client/favicon.ico`
5. Copy `.env.example` to `.env` and set `POSTGRES_DB`, `POSTGRES_USER`, `POSTGRES_PASSWORD` and update `DATABASE_URL`
6. Run:
   ```bash
   docker compose up -d
   npx prisma migrate dev
   npx prisma db seed
   npm run dev
   ```

## Checkout modes

### WhatsApp (default)
Orders sent to a WhatsApp number. Set `checkout.mode: "whatsapp"` and `whatsapp.number`.

### QR
Displays a QR code for payment. Set `checkout.mode: "qr"` and provide `checkout.qr.imageUrl`.
Place the QR image at `public/client/qr-pago.png`.

### Custom payment platform
Set `checkout.mode: "payment"` — currently shows a placeholder UI.
To wire up a real platform, implement `CheckoutAdapter` in `src/lib/checkout/custom-platform.ts`.

## Discounts

- **Strikethrough price:** Set `compareAtPrice` on a product (Prisma Studio or seed)
- **Coupon codes:** Add rows to the `Coupon` table. Type: `"percent"` or `"fixed"`, set `active: true`
- **Volume discounts:** Add `VolumeDiscount` rows linked to a product with `minQty`, `type`, `value`

## Managing products

Use Prisma Studio: `npx prisma studio` → Product table → Add row.
Or add to `prisma/seed.ts` and re-run `npx prisma db seed`.

## Deploying

1. Set up a PostgreSQL database (Supabase, Railway, Neon, etc.)
2. Set environment variables: `DATABASE_URL`, `NEXTAUTH_SECRET`, `NEXTAUTH_URL`
3. Run `npx prisma migrate deploy` (not `dev` — never run `migrate dev` in production)
4. Deploy to Vercel or any Node.js host
