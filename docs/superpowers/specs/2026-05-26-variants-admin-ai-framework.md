# Variants + Admin Panel + AI Framework — Design Spec
**Date:** 2026-05-26

## Overview

Three interconnected subsystems added to the e-commerce template:

1. **Product Variants** — Shopify-style flexible variant model (N option axes per product, price/stock per variant)
2. **AI Framework** — business-type profiles + CLI setup wizard that make the template instantly configurable for any commerce type by an AI or a human
3. **Admin Panel** — protected `/admin` route for day-to-day operations: products with variants, orders, coupons

These will be implemented as **two separate plans**:
- **Plan A:** Variants + AI Framework (schema change + storefront + business-type system + setup wizard)
- **Plan B:** Admin Panel (depends on Plan A completing the schema)

---

## Part 1 — Product Variants

### Data model

Four new/modified Prisma models:

```prisma
model ProductOption {
  id        String               @id @default(cuid())
  productId String
  product   Product              @relation(fields: [productId], references: [id], onDelete: Cascade)
  name      String               // "Talle", "Color", "Sabor", "Almacenamiento"
  position  Int                  @default(0)
  values    ProductOptionValue[]
}

model ProductOptionValue {
  id        String           @id @default(cuid())
  optionId  String
  option    ProductOption    @relation(fields: [optionId], references: [id], onDelete: Cascade)
  value     String           // "S", "M", "Rojo", "#FF0000", "Frutilla", "128GB"
  position  Int              @default(0)
  variants  ProductVariant[] @relation("VariantOptionValues")
}

model ProductVariant {
  id             String               @id @default(cuid())
  productId      String
  product        Product              @relation(fields: [productId], references: [id], onDelete: Cascade)
  sku            String?              @unique
  price          Decimal              @db.Decimal(10, 2)
  compareAtPrice Decimal?             @db.Decimal(10, 2)
  stock          Int                  @default(0)
  optionValues   ProductOptionValue[] @relation("VariantOptionValues")
  orderItems     OrderItem[]
  createdAt      DateTime             @default(now())
}
```

**Changes to existing models:**

`Product` — remove `price`, `compareAtPrice`, `stock`; add relations:
```prisma
options  ProductOption[]
variants ProductVariant[]
```

`User` — add role field:
```prisma
role String @default("user")  // "user" | "admin"
```

`OrderItem` — add variant reference + label snapshot:
```prisma
variantId    String?
variant      ProductVariant? @relation(fields: [variantId], references: [id])
variantLabel String?         // snapshot: "Talle: M / Color: Rojo"
```

### Core rule: every product has at least one variant

- Products without explicit option axes (e.g. a backpack) have one auto-created variant called "Default"
- The frontend checks `product.options.length === 0` — if so, renders no selector and adds the Default variant directly to cart
- This keeps the data model consistent: price and stock always live on variants

### Migration strategy

The migration must:
1. Create the four new/modified tables
2. For each existing `Product`, create one `ProductVariant` with `price`, `compareAtPrice`, `stock` copied from the product row, and no `optionValues` (Default variant)
3. Drop `price`, `compareAtPrice`, `stock` columns from `Product`

This is a data migration (not just schema) — it runs as a Prisma migration with a custom SQL step.

### Types (`src/lib/data/types.ts`)

New types added:
```typescript
export interface ProductOptionValue {
  id: string
  value: string
  position: number
}

export interface ProductOption {
  id: string
  name: string
  position: number
  values: ProductOptionValue[]
}

export interface ProductVariant {
  id: string
  sku: string | null
  price: number
  compareAtPrice: number | null
  stock: number
  optionValues: ProductOptionValue[]
}
```

`Product` updated — remove `price`, `compareAtPrice`, `stock`, add:
```typescript
options: ProductOption[]
variants: ProductVariant[]
```

`CartItem` updated — add variant reference:
```typescript
export interface CartItem {
  product: Product
  variant: ProductVariant
  variantLabel: string       // "Talle: M / Color: Rojo" or "Default"
  quantity: number
  unitPrice: number
  basePrice: number
}
```

### Data access layer changes

`src/lib/data/products.ts` — `getProducts()` and `getProduct()` include `options.values` and `variants.optionValues` in Prisma query. `mapProduct()` updated accordingly. Product list shows `min(variant.price)` as display price.

### Cart store changes (`src/lib/store/cart.ts`)

- `addItem(product, variant, quantity?)` — keyed by `variant.id` (not `product.id`)
- `removeItem(variantId: string)`
- `updateQuantity(variantId: string, quantity: number)`
- Volume discounts apply per variant price (not product price)
- `CartItem.basePrice = variant.price` before volume discount

### Storefront — VariantSelector component

New component: `src/components/product/VariantSelector.tsx`

**Props:**
```typescript
interface VariantSelectorProps {
  options: ProductOption[]
  variants: ProductVariant[]
  onSelect: (variant: ProductVariant | null) => void
}
```

**Rendering rules (generic — no business-type knowledge):**
- One selector group per option axis (name = label)
- If a value matches `/^#[0-9a-f]{3,6}$/i` → render as color circle (28×28px, border-radius 50%)
- Otherwise → render as text button (pill/chip style)
- A variant is unavailable if `stock === 0` → button rendered with `opacity-40 line-through cursor-not-allowed`
- When a selection makes no variant combination possible → show unavailable state
- Price shown below variant name updates to selected variant's price
- If selected variant price differs from min price → show difference (`+$X`)

`ProductDetail` page updated:
- If `product.options.length > 0` → render `<VariantSelector>`, "Add to cart" disabled until variant selected
- If `product.options.length === 0` → render no selector, add Default variant directly

---

## Part 2 — AI Framework

### Goal

Make the template instantly configurable for any commerce type. Two complementary paths:

**Path A (Claude Code / AI):** The developer tells an AI "set up a shoe store for a client in Buenos Aires" and the AI knows exactly what to do because CLAUDE.md points it to `business-types/` and gives step-by-step instructions.

**Path B (npm run setup):** A step-by-step CLI wizard that any developer can run without AI. Generates `client.config.ts` and seed data from the chosen business type.

### BusinessType interface (`business-types/base.ts`)

```typescript
export interface VariantAxis {
  name: string      // "Talle", "Sabor", "Almacenamiento"
  values: string[]  // ["S", "M", "L"] or ["128GB", "256GB"] or ["#000000", "#ffffff"]
}

export interface SampleProductVariant {
  options: Record<string, string>  // { Talle: "M", Color: "Rojo" }
  price: number
  compareAtPrice?: number
  stock: number
  sku?: string
}

export interface SampleProduct {
  name: string
  slug: string
  description: string
  categorySlug: string
  images: string[]             // placehold.co URLs by default
  variants: SampleProductVariant[]
}

export interface BusinessType {
  id: string
  name: string
  description: string
  variantAxes: VariantAxis[]
  defaultCategories: { name: string; slug: string }[]
  sampleProducts: SampleProduct[]
  suggestedConfig: {
    tagline?: string
    theme?: { primary?: string }
    checkout?: { mode?: 'whatsapp' | 'qr' | 'payment' }
  }
}
```

### Included business types

| File | Type | Variant axes | Categories |
|---|---|---|---|
| `clothing.ts` | Ropa | Talle (XS–XXL) × Color | Hombre, Mujer, Niños, Accesorios |
| `footwear.ts` | Zapatería | Talle (35–46) × Color | Deportivo, Casual, Niños |
| `electronics.ts` | Electrónica | Color × Garantía | Audio, Móviles, Computación |
| `food.ts` | Comida/Nutrición | Sabor × Tamaño | Proteínas, Snacks, Bebidas |

Each type includes 3–5 sample products with realistic variants, prices and stock.

### Setup wizard (`scripts/setup.ts`)

CLI tool using `@inquirer/prompts`. Run with: `npx tsx scripts/setup.ts`

Flow:
1. Select business type (list from registry) or "Otro (personalizado)"
2. Enter store name
3. Enter tagline
4. Enter brand color (hex, with validation)
5. Enter WhatsApp number
6. Select checkout mode (whatsapp / qr / payment)
7. If "Otro": manually enter variant axes (name + comma-separated values, repeat)

Outputs:
- Overwrites `client.config.ts` with entered values merged with `suggestedConfig`
- Overwrites `prisma/seed.ts` with categories + sample products from the chosen business type
- Asks: "¿Correr migraciones y seed ahora? (Y/n)"
- If yes: runs `npx prisma migrate dev --name setup && npx prisma db seed`

### CLAUDE.md updates

Add a new section "## AI Quick Setup" that:
- Lists all available business types with their variant axes
- Gives step-by-step instructions: read business type → edit client.config.ts → generate seed from SampleProduct[] → run migrate + seed
- Documents the `BusinessType` interface so the AI can create new business types

---

## Part 3 — Admin Panel

### Auth

`src/middleware.ts` — protects `/admin/*` routes:
- Reads NextAuth session
- Redirects to `/login?callbackUrl=/admin` if no session
- Redirects to `/` if session exists but `role !== "admin"`

Admin user created in seed: `admin@example.com / admin123` with `role: "admin"`. The existing demo user (`demo@example.com`) keeps `role: "user"`. There is no admin UI to promote users — promotion is done via Prisma Studio or seed.

### Route structure

```
src/app/(admin)/
├── layout.tsx          ← sidebar + auth check
├── page.tsx            ← /admin dashboard
├── products/
│   ├── page.tsx        ← /admin/products list
│   └── [id]/
│       └── page.tsx    ← /admin/products/[id] editor (new + edit)
├── orders/
│   ├── page.tsx        ← /admin/orders list
│   └── [id]/
│       └── page.tsx    ← /admin/orders/[id] detail
└── coupons/
    └── page.tsx        ← /admin/coupons list + create
```

All admin pages are Server Components where possible; interactive forms are `'use client'` components.

### Dashboard (`/admin`)

Stats from DB (server-side):
- Total active products
- Pending orders count
- Revenue this month (sum of Order.total where status != cancelled)
- Variants with stock ≤ 3 ("stock bajo")

Recent orders table: last 10 orders with ID, customer name, total, status.

### Products list (`/admin/products`)

Table columns: Name, Category, Variants count, Price range (min–max), Total stock, Actions (Edit, Delete).
"New product" button → `/admin/products/new`.
Search by name (client-side filter).

### Product editor (`/admin/products/[id]` and `/admin/products/new`)

Two-column layout:

**Left column — base data:**
- Name (text input)
- Slug (auto-generated from name, editable)
- Description (textarea)
- Category (select from DB)
- Images: drag-and-drop upload zone + URL paste input. Files POST to `/api/admin/upload`, saved to `public/uploads/[timestamp]-[originalname]`, returns URL array.

**Right column — options and variants:**
- "Agregar opción" button → adds a row with: option name input + tag input for values (press Enter or comma to add a value tag)
- Existing options editable inline
- Variant matrix auto-generated from option combinations:
  - Table with columns: Variante (read-only label), Precio, Precio tachado, Stock, SKU
  - Each row editable inline
  - When options change → matrix regenerates (preserving values for combinations that still exist)
- Toggle "Este producto no tiene variantes" → hides options UI, shows single price/stock fields (maps to Default variant)

Save: POST/PATCH to `/api/admin/products`. Returns updated product.

### Orders list and detail

List: filter tabs by status (todos / pendiente / confirmado / enviado / cancelado). Table with ID, customer name/email, date, total, status. Click row → detail page.

Detail: list of OrderItems with product name + variantLabel + quantity + unitPrice. Status selector dropdown. "Guardar estado" button → PATCH `/api/admin/orders/[id]`.

Order statuses: `pending` → `confirmed` → `shipped` → `delivered` | `cancelled`.

### Coupons

Table: Code, Type (% / $), Value, Min order, Expires, Active toggle.
"Nuevo cupón" inline form below table: code, type select, value, min order (optional), expires (optional date).
Toggle active → PATCH `/api/admin/coupons/[code]`.

### Image upload API

`POST /api/admin/upload` (admin-only, checks session role):
- Accepts `multipart/form-data` with `files[]`
- Saves to `public/uploads/` using `formidable`
- Returns `{ urls: string[] }`
- Max file size: 5MB per file, accepted: jpg/png/webp

### Admin data layer (`src/lib/data/admin/`)

New functions (server-side only, never imported in client components):
```typescript
// products.ts
getAdminProducts(): Promise<AdminProduct[]>
getAdminProduct(id: string): Promise<AdminProduct | null>
createProduct(data): Promise<Product>
updateProduct(id, data): Promise<Product>
deleteProduct(id): Promise<void>

// orders.ts
getAdminOrders(status?: string): Promise<AdminOrder[]>
getAdminOrder(id: string): Promise<AdminOrder | null>
updateOrderStatus(id, status): Promise<Order>
getDashboardStats(): Promise<DashboardStats>

// coupons.ts (admin version with full CRUD)
getAdminCoupons(): Promise<Coupon[]>
createCoupon(data): Promise<Coupon>
toggleCoupon(code, active): Promise<Coupon>
```

---

## File map

### Plan A — Variants + AI Framework

| File | Action |
|---|---|
| `prisma/schema.prisma` | Add ProductOption, ProductOptionValue, ProductVariant, User.role, OrderItem.variantId/variantLabel |
| `prisma/migrations/` | Data migration: create Default variant per existing product |
| `src/lib/data/types.ts` | Add ProductOption, ProductOptionValue, ProductVariant; update Product, CartItem |
| `src/lib/data/products.ts` | Update queries to include options+variants; update mapProduct() |
| `src/lib/store/cart.ts` | Key by variantId; addItem(product, variant, qty) |
| `src/components/product/VariantSelector.tsx` | New generic component |
| `src/app/(shop)/products/[slug]/page.tsx` | Integrate VariantSelector |
| `src/components/product/ProductCard.tsx` | Show "Desde $X" when multiple variant prices |
| `src/components/product/AddToCartButton.tsx` | Accept variant prop |
| `business-types/base.ts` | BusinessType interface |
| `business-types/clothing.ts` | Ropa profile |
| `business-types/footwear.ts` | Zapatería profile |
| `business-types/electronics.ts` | Electrónica profile |
| `business-types/food.ts` | Comida/Nutrición profile |
| `business-types/index.ts` | Registry |
| `scripts/setup.ts` | CLI wizard |
| `prisma/seed.ts` | Update to use BusinessType profiles |
| `CLAUDE.md` | Add AI Quick Setup section |

### Plan B — Admin Panel

| File | Action |
|---|---|
| `src/middleware.ts` | Protect /admin/* routes |
| `src/app/(admin)/layout.tsx` | Sidebar + auth check |
| `src/app/(admin)/page.tsx` | Dashboard |
| `src/app/(admin)/products/page.tsx` | Products list |
| `src/app/(admin)/products/[id]/page.tsx` | Product editor |
| `src/app/(admin)/orders/page.tsx` | Orders list |
| `src/app/(admin)/orders/[id]/page.tsx` | Order detail |
| `src/app/(admin)/coupons/page.tsx` | Coupons |
| `src/app/api/admin/upload/route.ts` | Image upload |
| `src/app/api/admin/products/route.ts` | Products CRUD API |
| `src/app/api/admin/products/[id]/route.ts` | Single product API |
| `src/app/api/admin/orders/[id]/route.ts` | Order status update |
| `src/app/api/admin/coupons/route.ts` | Coupons CRUD |
| `src/lib/data/admin/products.ts` | Admin product queries |
| `src/lib/data/admin/orders.ts` | Admin order queries |
| `src/lib/data/admin/coupons.ts` | Admin coupon queries |
| `prisma/seed.ts` | Add admin user (admin@example.com / admin123) |

---

## Out of scope (this version)

- Real-time stock sync across browser tabs
- Bulk product import (CSV)
- Image CDN (uploads are local to the VPS)
- Analytics charts beyond simple stat cards
- Multi-language admin UI
- Admin user management (only one admin role, no staff permissions)
