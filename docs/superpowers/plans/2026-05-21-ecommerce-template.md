# E-commerce Template Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a production-ready, client-customizable e-commerce Next.js template with PostgreSQL, Prisma, pluggable checkout (WhatsApp / QR / payment), and a single `client.config.ts` that controls all branding and features.

**Architecture:** Next.js App Router with a PostgreSQL database in Docker managed by Prisma. All data access goes through `src/lib/data/` functions. Checkout is a plugin system driven by `client.config.ts`. Cart state lives in Zustand client-side.

**Tech Stack:** Next.js 14+, TypeScript, Tailwind CSS, shadcn/ui, Prisma 5, PostgreSQL 16 (Docker), Zustand, NextAuth v4, Jest + React Testing Library.

---

## File Map

| File | Responsibility |
|---|---|
| `client.config.ts` | All per-client customization |
| `docker-compose.yml` | PostgreSQL container |
| `.env` / `.env.example` | DB credentials, NextAuth secret |
| `prisma/schema.prisma` | DB models |
| `prisma/seed.ts` | Sample data for local dev |
| `src/lib/db.ts` | Prisma client singleton |
| `src/lib/data/types.ts` | Shared TypeScript types |
| `src/lib/data/products.ts` | `getProducts()`, `getProduct()` |
| `src/lib/data/categories.ts` | `getCategories()` |
| `src/lib/data/coupons.ts` | `validateCoupon()` |
| `src/lib/store/cart.ts` | Zustand cart store + discount logic |
| `src/lib/checkout/types.ts` | `CheckoutAdapter` interface |
| `src/lib/checkout/whatsapp.ts` | WhatsApp redirect adapter |
| `src/lib/checkout/qr.ts` | QR display adapter |
| `src/lib/checkout/placeholder.ts` | "Coming soon" adapter |
| `src/lib/checkout/index.ts` | Selects adapter from config |
| `src/app/(shop)/page.tsx` | Home / landing |
| `src/app/(shop)/products/page.tsx` | Catalog + filters |
| `src/app/(shop)/products/[slug]/page.tsx` | Product detail |
| `src/app/(shop)/cart/page.tsx` | Cart page |
| `src/app/(shop)/checkout/page.tsx` | Checkout page |
| `src/app/(auth)/login/page.tsx` | Login |
| `src/app/(auth)/register/page.tsx` | Register |
| `src/app/api/auth/[...nextauth]/route.ts` | NextAuth handler |
| `src/components/layout/Header.tsx` | Site header |
| `src/components/layout/Footer.tsx` | Site footer |
| `src/components/product/ProductCard.tsx` | Single product card |
| `src/components/product/ProductGrid.tsx` | Grid of ProductCards |
| `src/components/filters/FilterSidebar.tsx` | Filter panel |
| `src/components/cart/CartDrawer.tsx` | Slide-out cart |
| `src/components/cart/CartSummary.tsx` | Subtotal + discounts + total |
| `src/components/cart/CouponInput.tsx` | Coupon code input |
| `src/app/api/coupon/validate/route.ts` | API route for coupon validation (called by client) |
| `CLAUDE.md` | AI assistant guide |
| `docs/CUSTOMIZATION.md` | Human guide per client |

---

### Task 1: Scaffold Next.js project and install dependencies

**Files:**
- Create: (project root — `create-next-app` generates everything)

- [ ] **Step 1: Scaffold the project**

Run inside `ecommerce-template/` (answer Yes to any prompts about existing files):

```bash
npx create-next-app@latest . --typescript --tailwind --eslint --app --src-dir --import-alias "@/*" --no-turbopack
```

Expected: Next.js project created with `src/app/`, `tailwind.config.ts`, `tsconfig.json`.

- [ ] **Step 2: Install runtime dependencies**

```bash
npm install zustand next-auth@4 bcryptjs @prisma/client prisma
```

- [ ] **Step 3: Install dev dependencies**

```bash
npm install --save-dev @types/bcryptjs jest jest-environment-jsdom @testing-library/react @testing-library/jest-dom ts-node
```

- [ ] **Step 4: Create Jest config**

Create `jest.config.ts`:

```typescript
import type { Config } from 'jest'
import nextJest from 'next/jest.js'

const createJestConfig = nextJest({ dir: './' })

const config: Config = {
  testEnvironment: 'jsdom',
  setupFilesAfterFramework: ['<rootDir>/jest.setup.ts'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
}

export default createJestConfig(config)
```

Create `jest.setup.ts`:

```typescript
import '@testing-library/jest-dom'
```

- [ ] **Step 5: Add test script to package.json**

In `package.json`, add to `"scripts"`:

```json
"test": "jest",
"test:watch": "jest --watch"
```

- [ ] **Step 6: Commit**

```bash
git init
git add .
git commit -m "feat: scaffold Next.js project with dependencies"
```

---

### Task 2: Docker + PostgreSQL + environment setup

**Files:**
- Create: `docker-compose.yml`
- Create: `.env.example`
- Create: `.env` (git-ignored)

- [ ] **Step 1: Create `docker-compose.yml`**

```yaml
services:
  db:
    image: postgres:16
    restart: unless-stopped
    environment:
      POSTGRES_USER: ${POSTGRES_USER}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
      POSTGRES_DB: ${POSTGRES_DB}
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

volumes:
  postgres_data:
```

- [ ] **Step 2: Create `.env.example`**

```bash
# Database
POSTGRES_USER=ecommerce
POSTGRES_PASSWORD=secret
POSTGRES_DB=ecommerce_dev
DATABASE_URL="postgresql://ecommerce:secret@localhost:5432/ecommerce_dev"

# NextAuth
NEXTAUTH_SECRET=your-secret-here
NEXTAUTH_URL=http://localhost:3000
```

- [ ] **Step 3: Create `.env` with real local values**

```bash
POSTGRES_USER=ecommerce
POSTGRES_PASSWORD=secret
POSTGRES_DB=ecommerce_dev
DATABASE_URL="postgresql://ecommerce:secret@localhost:5432/ecommerce_dev"
NEXTAUTH_SECRET=supersecretlocalkey123
NEXTAUTH_URL=http://localhost:3000
```

- [ ] **Step 4: Add `.env` to `.gitignore`**

Verify `.gitignore` contains `.env` (create-next-app adds it). If not, add:

```
.env
```

- [ ] **Step 5: Start PostgreSQL**

```bash
docker compose up -d
```

Expected output: `Container ecommerce-template-db-1  Started`

- [ ] **Step 6: Verify connection**

```bash
docker compose ps
```

Expected: `db` service shows `running`.

- [ ] **Step 7: Commit**

```bash
git add docker-compose.yml .env.example .gitignore
git commit -m "feat: add Docker PostgreSQL setup"
```

---

### Task 3: Prisma schema and initial migration

**Files:**
- Create: `prisma/schema.prisma`

- [ ] **Step 1: Initialize Prisma**

```bash
npx prisma init --datasource-provider postgresql
```

Expected: `prisma/schema.prisma` created, `DATABASE_URL` noted in output.

- [ ] **Step 2: Write the full schema**

Replace `prisma/schema.prisma` with:

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model Category {
  id       String    @id @default(cuid())
  slug     String    @unique
  name     String
  products Product[]
}

model Product {
  id              String           @id @default(cuid())
  slug            String           @unique
  name            String
  description     String
  images          String[]
  price           Decimal          @db.Decimal(10, 2)
  compareAtPrice  Decimal?         @db.Decimal(10, 2)
  stock           Int              @default(0)
  categoryId      String
  category        Category         @relation(fields: [categoryId], references: [id])
  volumeDiscounts VolumeDiscount[]
  orderItems      OrderItem[]
  createdAt       DateTime         @default(now())
  updatedAt       DateTime         @updatedAt
}

model VolumeDiscount {
  id        String  @id @default(cuid())
  minQty    Int
  type      String
  value     Decimal @db.Decimal(10, 2)
  productId String
  product   Product @relation(fields: [productId], references: [id], onDelete: Cascade)
}

model Coupon {
  code           String    @id
  type           String
  value          Decimal   @db.Decimal(10, 2)
  minOrderAmount Decimal?  @db.Decimal(10, 2)
  expiresAt      DateTime?
  active         Boolean   @default(true)
}

model User {
  id        String   @id @default(cuid())
  email     String   @unique
  name      String
  password  String
  orders    Order[]
  createdAt DateTime @default(now())
}

model Order {
  id         String      @id @default(cuid())
  userId     String?
  user       User?       @relation(fields: [userId], references: [id])
  items      OrderItem[]
  subtotal   Decimal     @db.Decimal(10, 2)
  discount   Decimal     @db.Decimal(10, 2) @default(0)
  total      Decimal     @db.Decimal(10, 2)
  couponCode String?
  status     String      @default("pending")
  createdAt  DateTime    @default(now())
}

model OrderItem {
  id        String  @id @default(cuid())
  orderId   String
  order     Order   @relation(fields: [orderId], references: [id], onDelete: Cascade)
  productId String
  product   Product @relation(fields: [productId], references: [id])
  quantity  Int
  unitPrice Decimal @db.Decimal(10, 2)
}
```

- [ ] **Step 3: Run initial migration**

```bash
npx prisma migrate dev --name init
```

Expected: Migration applied, `prisma/migrations/` folder created.

- [ ] **Step 4: Generate Prisma client**

```bash
npx prisma generate
```

Expected: `✔ Generated Prisma Client`

- [ ] **Step 5: Commit**

```bash
git add prisma/
git commit -m "feat: add Prisma schema with all models"
```

---

### Task 4: client.config.ts

**Files:**
- Create: `client.config.ts`

- [ ] **Step 1: Create the config file**

Create `client.config.ts` in the project root:

```typescript
export interface ClientConfig {
  name: string
  tagline: string
  logo: string
  favicon: string
  theme: {
    primary: string
    background: string
    foreground: string
    font: string
  }
  whatsapp: {
    number: string
    messageTemplate: string
  }
  checkout: {
    mode: 'whatsapp' | 'qr' | 'payment'
    qr?: {
      imageUrl: string
      instructions: string
    }
  }
  discounts: {
    couponsEnabled: boolean
    volumeDiscountsEnabled: boolean
  }
  features: {
    auth: boolean
    wishlist: boolean
    reviews: boolean
    searchBar: boolean
  }
}

const config: ClientConfig = {
  name: 'Mi Tienda',
  tagline: 'Los mejores productos',
  logo: '/client/logo.png',
  favicon: '/client/favicon.ico',

  theme: {
    primary: '#16a34a',
    background: '#ffffff',
    foreground: '#0a0a0a',
    font: 'Inter',
  },

  whatsapp: {
    number: '+521234567890',
    messageTemplate: 'Hola! Quiero pedir:\n{items}\nTotal: {total}',
  },

  checkout: {
    mode: 'whatsapp',
    qr: {
      imageUrl: '/client/qr-pago.png',
      instructions: 'Escanea el QR y envía el comprobante por WhatsApp',
    },
  },

  discounts: {
    couponsEnabled: true,
    volumeDiscountsEnabled: true,
  },

  features: {
    auth: true,
    wishlist: false,
    reviews: false,
    searchBar: true,
  },
}

export default config
```

- [ ] **Step 2: Create placeholder client assets**

```bash
mkdir -p public/client
```

Add a placeholder `public/client/.gitkeep` so the folder is tracked:

```bash
touch public/client/.gitkeep
```

- [ ] **Step 3: Commit**

```bash
git add client.config.ts public/client/.gitkeep
git commit -m "feat: add client.config.ts with full type definition"
```

---

### Task 5: Prisma singleton and shared types

**Files:**
- Create: `src/lib/db.ts`
- Create: `src/lib/data/types.ts`

- [ ] **Step 1: Create Prisma client singleton**

Create `src/lib/db.ts`:

```typescript
import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient }

export const prisma =
  globalForPrisma.prisma ?? new PrismaClient({ log: ['error'] })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
```

- [ ] **Step 2: Create shared app types**

Create `src/lib/data/types.ts`:

```typescript
export interface Category {
  id: string
  slug: string
  name: string
}

export interface VolumeDiscount {
  id: string
  minQty: number
  type: 'percent' | 'fixed'
  value: number
  productId: string
}

export interface Product {
  id: string
  slug: string
  name: string
  description: string
  images: string[]
  price: number
  compareAtPrice: number | null
  stock: number
  categoryId: string
  category: Category
  volumeDiscounts: VolumeDiscount[]
}

export interface Coupon {
  code: string
  type: 'percent' | 'fixed'
  value: number
  minOrderAmount: number | null
  expiresAt: Date | null
  active: boolean
}

export interface ProductFilters {
  categorySlug?: string
  minPrice?: number
  maxPrice?: number
  search?: string
}

export interface CartItem {
  product: Product
  quantity: number
  unitPrice: number
}

export interface Customer {
  name: string
  email: string
  phone?: string
}
```

- [ ] **Step 3: Commit**

```bash
git add src/lib/db.ts src/lib/data/types.ts
git commit -m "feat: add Prisma singleton and shared types"
```

---

### Task 6: Data access layer with tests

**Files:**
- Create: `src/lib/data/products.ts`
- Create: `src/lib/data/categories.ts`
- Create: `src/lib/data/coupons.ts`
- Create: `src/__tests__/lib/data/products.test.ts`
- Create: `src/__tests__/lib/data/coupons.test.ts`

- [ ] **Step 1: Write the failing test for getProducts**

Create `src/__tests__/lib/data/products.test.ts`:

```typescript
jest.mock('@/lib/db', () => ({
  prisma: {
    product: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
    },
  },
}))

import { getProducts, getProduct } from '@/lib/data/products'
import { prisma } from '@/lib/db'

const mockProduct = {
  id: 'p1',
  slug: 'camiseta-blanca',
  name: 'Camiseta Blanca',
  description: 'Camiseta de algodón',
  images: ['/img/camiseta.jpg'],
  price: { toNumber: () => 25.0 },
  compareAtPrice: null,
  stock: 10,
  categoryId: 'c1',
  category: { id: 'c1', slug: 'ropa', name: 'Ropa' },
  volumeDiscounts: [],
  createdAt: new Date(),
  updatedAt: new Date(),
}

describe('getProducts', () => {
  it('returns mapped products', async () => {
    ;(prisma.product.findMany as jest.Mock).mockResolvedValue([mockProduct])
    const products = await getProducts()
    expect(products).toHaveLength(1)
    expect(products[0].slug).toBe('camiseta-blanca')
    expect(products[0].price).toBe(25.0)
  })

  it('filters by category slug', async () => {
    ;(prisma.product.findMany as jest.Mock).mockResolvedValue([])
    await getProducts({ categorySlug: 'ropa' })
    expect(prisma.product.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          category: { slug: 'ropa' },
        }),
      })
    )
  })
})

describe('getProduct', () => {
  it('returns null when product not found', async () => {
    ;(prisma.product.findUnique as jest.Mock).mockResolvedValue(null)
    const result = await getProduct('no-existe')
    expect(result).toBeNull()
  })

  it('returns mapped product when found', async () => {
    ;(prisma.product.findUnique as jest.Mock).mockResolvedValue(mockProduct)
    const result = await getProduct('camiseta-blanca')
    expect(result?.name).toBe('Camiseta Blanca')
  })
})
```

- [ ] **Step 2: Run test — expect FAIL**

```bash
npm test -- src/__tests__/lib/data/products.test.ts
```

Expected: FAIL — `Cannot find module '@/lib/data/products'`

- [ ] **Step 3: Implement products.ts**

Create `src/lib/data/products.ts`:

```typescript
import { prisma } from '@/lib/db'
import type { Product, ProductFilters } from './types'

function mapProduct(p: any): Product {
  return {
    id: p.id,
    slug: p.slug,
    name: p.name,
    description: p.description,
    images: p.images,
    price: p.price.toNumber(),
    compareAtPrice: p.compareAtPrice ? p.compareAtPrice.toNumber() : null,
    stock: p.stock,
    categoryId: p.categoryId,
    category: p.category,
    volumeDiscounts: p.volumeDiscounts.map((d: any) => ({
      id: d.id,
      minQty: d.minQty,
      type: d.type as 'percent' | 'fixed',
      value: d.value.toNumber(),
      productId: d.productId,
    })),
  }
}

export async function getProducts(filters?: ProductFilters): Promise<Product[]> {
  const where: any = {}

  if (filters?.categorySlug) {
    where.category = { slug: filters.categorySlug }
  }
  if (filters?.minPrice !== undefined || filters?.maxPrice !== undefined) {
    where.price = {}
    if (filters.minPrice !== undefined) where.price.gte = filters.minPrice
    if (filters.maxPrice !== undefined) where.price.lte = filters.maxPrice
  }
  if (filters?.search) {
    where.OR = [
      { name: { contains: filters.search, mode: 'insensitive' } },
      { description: { contains: filters.search, mode: 'insensitive' } },
    ]
  }

  const products = await prisma.product.findMany({
    where,
    include: { category: true, volumeDiscounts: true },
    orderBy: { createdAt: 'desc' },
  })

  return products.map(mapProduct)
}

export async function getProduct(slug: string): Promise<Product | null> {
  const product = await prisma.product.findUnique({
    where: { slug },
    include: { category: true, volumeDiscounts: true },
  })
  return product ? mapProduct(product) : null
}
```

- [ ] **Step 4: Run test — expect PASS**

```bash
npm test -- src/__tests__/lib/data/products.test.ts
```

Expected: PASS — 4 tests passing.

- [ ] **Step 5: Write coupon test**

Create `src/__tests__/lib/data/coupons.test.ts`:

```typescript
jest.mock('@/lib/db', () => ({
  prisma: {
    coupon: { findUnique: jest.fn() },
  },
}))

import { validateCoupon } from '@/lib/data/coupons'
import { prisma } from '@/lib/db'

describe('validateCoupon', () => {
  it('returns null for inactive coupon', async () => {
    ;(prisma.coupon.findUnique as jest.Mock).mockResolvedValue({
      code: 'INACTIVE',
      type: 'percent',
      value: { toNumber: () => 10 },
      minOrderAmount: null,
      expiresAt: null,
      active: false,
    })
    const result = await validateCoupon('INACTIVE')
    expect(result).toBeNull()
  })

  it('returns null for expired coupon', async () => {
    ;(prisma.coupon.findUnique as jest.Mock).mockResolvedValue({
      code: 'EXPIRED',
      type: 'percent',
      value: { toNumber: () => 10 },
      minOrderAmount: null,
      expiresAt: new Date('2020-01-01'),
      active: true,
    })
    const result = await validateCoupon('EXPIRED')
    expect(result).toBeNull()
  })

  it('returns coupon for valid active code', async () => {
    ;(prisma.coupon.findUnique as jest.Mock).mockResolvedValue({
      code: 'VERANO20',
      type: 'percent',
      value: { toNumber: () => 20 },
      minOrderAmount: null,
      expiresAt: null,
      active: true,
    })
    const result = await validateCoupon('VERANO20')
    expect(result?.code).toBe('VERANO20')
    expect(result?.value).toBe(20)
  })
})
```

- [ ] **Step 6: Run test — expect FAIL**

```bash
npm test -- src/__tests__/lib/data/coupons.test.ts
```

Expected: FAIL — `Cannot find module '@/lib/data/coupons'`

- [ ] **Step 7: Implement categories.ts and coupons.ts**

Create `src/lib/data/categories.ts`:

```typescript
import { prisma } from '@/lib/db'
import type { Category } from './types'

export async function getCategories(): Promise<Category[]> {
  return prisma.category.findMany({ orderBy: { name: 'asc' } })
}
```

Create `src/lib/data/coupons.ts`:

```typescript
import { prisma } from '@/lib/db'
import type { Coupon } from './types'

export async function validateCoupon(code: string): Promise<Coupon | null> {
  const coupon = await prisma.coupon.findUnique({ where: { code: code.toUpperCase() } })

  if (!coupon || !coupon.active) return null
  if (coupon.expiresAt && coupon.expiresAt < new Date()) return null

  return {
    code: coupon.code,
    type: coupon.type as 'percent' | 'fixed',
    value: coupon.value.toNumber(),
    minOrderAmount: coupon.minOrderAmount ? coupon.minOrderAmount.toNumber() : null,
    expiresAt: coupon.expiresAt,
    active: coupon.active,
  }
}
```

- [ ] **Step 8: Run all tests — expect PASS**

```bash
npm test
```

Expected: All tests passing.

- [ ] **Step 9: Commit**

```bash
git add src/lib/data/ src/__tests__/
git commit -m "feat: add data access layer with tests"
```

---

### Task 7: Seed data

**Files:**
- Create: `prisma/seed.ts`

- [ ] **Step 1: Add seed script to package.json**

In `package.json`, add:

```json
"prisma": {
  "seed": "ts-node --compiler-options {\"module\":\"CommonJS\"} prisma/seed.ts"
}
```

- [ ] **Step 2: Install ts-node if not present**

```bash
npm install --save-dev ts-node
```

- [ ] **Step 3: Create seed file**

Create `prisma/seed.ts`:

```typescript
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  // Categories
  const ropa = await prisma.category.upsert({
    where: { slug: 'ropa' },
    update: {},
    create: { slug: 'ropa', name: 'Ropa' },
  })
  const accesorios = await prisma.category.upsert({
    where: { slug: 'accesorios' },
    update: {},
    create: { slug: 'accesorios', name: 'Accesorios' },
  })
  const electronica = await prisma.category.upsert({
    where: { slug: 'electronica' },
    update: {},
    create: { slug: 'electronica', name: 'Electrónica' },
  })

  // Products
  await prisma.product.upsert({
    where: { slug: 'camiseta-blanca' },
    update: {},
    create: {
      slug: 'camiseta-blanca',
      name: 'Camiseta Blanca',
      description: 'Camiseta de algodón 100%, corte clásico. Ideal para el día a día.',
      images: ['https://placehold.co/600x600?text=Camiseta'],
      price: 25.00,
      compareAtPrice: 35.00,
      stock: 50,
      categoryId: ropa.id,
      volumeDiscounts: {
        create: [
          { minQty: 3, type: 'percent', value: 10 },
          { minQty: 5, type: 'percent', value: 20 },
        ],
      },
    },
  })

  await prisma.product.upsert({
    where: { slug: 'jeans-slim' },
    update: {},
    create: {
      slug: 'jeans-slim',
      name: 'Jeans Slim Fit',
      description: 'Jeans de mezclilla premium, corte slim. Disponible en varios talles.',
      images: ['https://placehold.co/600x600?text=Jeans'],
      price: 60.00,
      compareAtPrice: null,
      stock: 30,
      categoryId: ropa.id,
    },
  })

  await prisma.product.upsert({
    where: { slug: 'mochila-urbana' },
    update: {},
    create: {
      slug: 'mochila-urbana',
      name: 'Mochila Urbana',
      description: 'Mochila resistente al agua con compartimento para laptop de 15".',
      images: ['https://placehold.co/600x600?text=Mochila'],
      price: 45.00,
      compareAtPrice: 55.00,
      stock: 20,
      categoryId: accesorios.id,
    },
  })

  await prisma.product.upsert({
    where: { slug: 'auriculares-bt' },
    update: {},
    create: {
      slug: 'auriculares-bt',
      name: 'Auriculares Bluetooth',
      description: 'Auriculares inalámbricos con cancelación de ruido y 20h de batería.',
      images: ['https://placehold.co/600x600?text=Auriculares'],
      price: 89.00,
      compareAtPrice: 120.00,
      stock: 15,
      categoryId: electronica.id,
      volumeDiscounts: {
        create: [{ minQty: 2, type: 'fixed', value: 10 }],
      },
    },
  })

  await prisma.product.upsert({
    where: { slug: 'reloj-minimalista' },
    update: {},
    create: {
      slug: 'reloj-minimalista',
      name: 'Reloj Minimalista',
      description: 'Reloj de pulsera de diseño minimalista, correa de cuero genuino.',
      images: ['https://placehold.co/600x600?text=Reloj'],
      price: 75.00,
      compareAtPrice: null,
      stock: 10,
      categoryId: accesorios.id,
    },
  })

  // Coupons
  await prisma.coupon.upsert({
    where: { code: 'VERANO20' },
    update: {},
    create: { code: 'VERANO20', type: 'percent', value: 20, active: true },
  })
  await prisma.coupon.upsert({
    where: { code: 'DESCUENTO10' },
    update: {},
    create: { code: 'DESCUENTO10', type: 'fixed', value: 10, minOrderAmount: 50, active: true },
  })

  // Demo user (password: "password123")
  const hash = await bcrypt.hash('password123', 10)
  await prisma.user.upsert({
    where: { email: 'demo@example.com' },
    update: {},
    create: { email: 'demo@example.com', name: 'Usuario Demo', password: hash },
  })

  console.log('✅ Seed completed')
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
```

- [ ] **Step 4: Run seed**

```bash
npx prisma db seed
```

Expected: `✅ Seed completed`

- [ ] **Step 5: Verify data in Prisma Studio**

```bash
npx prisma studio
```

Open `http://localhost:5555` and confirm 5 products, 3 categories, 2 coupons, 1 user.

- [ ] **Step 6: Commit**

```bash
git add prisma/seed.ts package.json
git commit -m "feat: add seed data with products, categories and coupons"
```

---

### Task 8: shadcn/ui setup and theme system

**Files:**
- Modify: `src/app/globals.css`
- Create: `src/lib/theme.ts`
- Modify: `src/app/layout.tsx`

- [ ] **Step 1: Initialize shadcn/ui**

```bash
npx shadcn@latest init
```

When prompted:
- Style: **Default**
- Base color: **Neutral**
- CSS variables: **Yes**

- [ ] **Step 2: Install needed components**

```bash
npx shadcn@latest add button card badge input label separator sheet dialog select slider
```

- [ ] **Step 3: Create theme utility that reads client.config**

Create `src/lib/theme.ts`:

```typescript
import config from '../../client.config'

export function getCssVariables(): Record<string, string> {
  const { theme } = config
  // Convert hex to HSL for shadcn CSS variables
  return {
    '--font-sans': theme.font,
  }
}

export function getPrimaryColor(): string {
  return config.theme.primary
}
```

- [ ] **Step 4: Update globals.css to inject client theme**

In `src/app/globals.css`, find the `:root` block and add the primary color override at the end of `:root`:

```css
:root {
  /* ... existing shadcn variables ... */
  --brand-primary: v-bind(primary); /* updated via layout */
}
```

Instead of CSS v-bind (not supported), update `src/app/layout.tsx` to inject inline CSS variables:

```typescript
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import config from '../../client.config'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: config.name,
  description: config.tagline,
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es">
      <head>
        <style>{`
          :root {
            --brand-primary: ${config.theme.primary};
            --brand-bg: ${config.theme.background};
          }
        `}</style>
      </head>
      <body className={inter.className}>{children}</body>
    </html>
  )
}
```

- [ ] **Step 5: Commit**

```bash
git add src/ components.json
git commit -m "feat: set up shadcn/ui and theme system from client.config"
```

---

### Task 9: Layout components (Header, Footer)

**Files:**
- Create: `src/components/layout/Header.tsx`
- Create: `src/components/layout/Footer.tsx`
- Create: `src/components/layout/CartIcon.tsx`

- [ ] **Step 1: Create CartIcon component**

Create `src/components/layout/CartIcon.tsx`:

```typescript
'use client'

import Link from 'next/link'
import { ShoppingCart } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useCartStore } from '@/lib/store/cart'

export function CartIcon() {
  const totalItems = useCartStore((s) => s.items.reduce((sum, i) => sum + i.quantity, 0))

  return (
    <Button variant="ghost" size="icon" asChild className="relative">
      <Link href="/cart">
        <ShoppingCart className="h-5 w-5" />
        {totalItems > 0 && (
          <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-[var(--brand-primary)] text-[10px] text-white font-bold">
            {totalItems}
          </span>
        )}
      </Link>
    </Button>
  )
}
```

- [ ] **Step 2: Create Header**

Create `src/components/layout/Header.tsx`:

```typescript
import Link from 'next/link'
import Image from 'next/image'
import config from '../../../client.config'
import { CartIcon } from './CartIcon'
import { Button } from '@/components/ui/button'

export function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2">
          <span className="text-xl font-bold" style={{ color: config.theme.primary }}>
            {config.name}
          </span>
        </Link>

        <nav className="hidden md:flex items-center gap-6 text-sm">
          <Link href="/products" className="text-muted-foreground hover:text-foreground transition-colors">
            Productos
          </Link>
        </nav>

        <div className="flex items-center gap-2">
          {config.features.auth && (
            <Button variant="ghost" size="sm" asChild>
              <Link href="/login">Entrar</Link>
            </Button>
          )}
          <CartIcon />
        </div>
      </div>
    </header>
  )
}
```

- [ ] **Step 3: Create Footer**

Create `src/components/layout/Footer.tsx`:

```typescript
import config from '../../../client.config'

export function Footer() {
  return (
    <footer className="border-t bg-muted/40 mt-auto">
      <div className="container mx-auto px-4 py-8 text-center text-sm text-muted-foreground">
        <p>© {new Date().getFullYear()} {config.name}. Todos los derechos reservados.</p>
      </div>
    </footer>
  )
}
```

- [ ] **Step 4: Add layout to shop route group**

Create `src/app/(shop)/layout.tsx`:

```typescript
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'

export default function ShopLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  )
}
```

- [ ] **Step 5: Install lucide-react (if not already included)**

```bash
npm install lucide-react
```

- [ ] **Step 6: Commit**

```bash
git add src/components/layout/ src/app/
git commit -m "feat: add Header, Footer and shop layout"
```

---

### Task 10: Cart store with discount logic (with tests)

**Files:**
- Create: `src/lib/store/cart.ts`
- Create: `src/__tests__/lib/store/cart.test.ts`

- [ ] **Step 1: Write failing tests for cart store**

Create `src/__tests__/lib/store/cart.test.ts`:

```typescript
import { renderHook, act } from '@testing-library/react'
import { useCartStore } from '@/lib/store/cart'
import type { Product } from '@/lib/data/types'

const baseProduct: Product = {
  id: 'p1',
  slug: 'test',
  name: 'Test Product',
  description: '',
  images: [],
  price: 100,
  compareAtPrice: null,
  stock: 20,
  categoryId: 'c1',
  category: { id: 'c1', slug: 'cat', name: 'Cat' },
  volumeDiscounts: [],
}

const productWithVolumeDiscount: Product = {
  ...baseProduct,
  id: 'p2',
  slug: 'vol',
  volumeDiscounts: [
    { id: 'd1', minQty: 3, type: 'percent', value: 10, productId: 'p2' },
  ],
}

describe('cart store', () => {
  beforeEach(() => {
    useCartStore.setState({ items: [], coupon: null, couponError: null })
  })

  it('adds an item', () => {
    const { result } = renderHook(() => useCartStore())
    act(() => result.current.addItem(baseProduct))
    expect(result.current.items).toHaveLength(1)
    expect(result.current.items[0].quantity).toBe(1)
    expect(result.current.items[0].unitPrice).toBe(100)
  })

  it('increments quantity when adding same product', () => {
    const { result } = renderHook(() => useCartStore())
    act(() => result.current.addItem(baseProduct))
    act(() => result.current.addItem(baseProduct))
    expect(result.current.items[0].quantity).toBe(2)
  })

  it('removes an item', () => {
    const { result } = renderHook(() => useCartStore())
    act(() => result.current.addItem(baseProduct))
    act(() => result.current.removeItem('p1'))
    expect(result.current.items).toHaveLength(0)
  })

  it('applies volume discount when quantity threshold met', () => {
    const { result } = renderHook(() => useCartStore())
    act(() => result.current.addItem(productWithVolumeDiscount, 3))
    expect(result.current.items[0].unitPrice).toBe(90) // 100 * (1 - 0.10)
  })

  it('does not apply volume discount below threshold', () => {
    const { result } = renderHook(() => useCartStore())
    act(() => result.current.addItem(productWithVolumeDiscount, 2))
    expect(result.current.items[0].unitPrice).toBe(100)
  })

  it('applies percent coupon to subtotal', () => {
    const { result } = renderHook(() => useCartStore())
    act(() => result.current.addItem(baseProduct, 2)) // subtotal = 200
    act(() =>
      result.current.applyCoupon({
        code: 'TEST20',
        type: 'percent',
        value: 20,
        minOrderAmount: null,
        expiresAt: null,
        active: true,
      })
    )
    const { subtotal, couponDiscount, total } = result.current.getSummary()
    expect(subtotal).toBe(200)
    expect(couponDiscount).toBe(40)
    expect(total).toBe(160)
  })

  it('applies fixed coupon to subtotal', () => {
    const { result } = renderHook(() => useCartStore())
    act(() => result.current.addItem(baseProduct, 1))
    act(() =>
      result.current.applyCoupon({
        code: 'OFF10',
        type: 'fixed',
        value: 10,
        minOrderAmount: null,
        expiresAt: null,
        active: true,
      })
    )
    const { total } = result.current.getSummary()
    expect(total).toBe(90)
  })

  it('rejects coupon below min order amount', () => {
    const { result } = renderHook(() => useCartStore())
    act(() => result.current.addItem(baseProduct, 1)) // subtotal = 100
    act(() =>
      result.current.applyCoupon({
        code: 'MIN200',
        type: 'fixed',
        value: 20,
        minOrderAmount: 200,
        expiresAt: null,
        active: true,
      })
    )
    expect(result.current.coupon).toBeNull()
    expect(result.current.couponError).toMatch(/mínimo/)
  })

  it('clears cart', () => {
    const { result } = renderHook(() => useCartStore())
    act(() => result.current.addItem(baseProduct))
    act(() => result.current.clearCart())
    expect(result.current.items).toHaveLength(0)
  })
})
```

- [ ] **Step 2: Run tests — expect FAIL**

```bash
npm test -- src/__tests__/lib/store/cart.test.ts
```

Expected: FAIL — `Cannot find module '@/lib/store/cart'`

- [ ] **Step 3: Implement cart store**

Create `src/lib/store/cart.ts`:

```typescript
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { CartItem, Coupon, Product } from '@/lib/data/types'

function applyVolumeDiscount(product: Product, quantity: number): number {
  if (!product.volumeDiscounts.length) return product.price

  const applicable = product.volumeDiscounts
    .filter((d) => quantity >= d.minQty)
    .sort((a, b) => b.minQty - a.minQty)[0]

  if (!applicable) return product.price

  if (applicable.type === 'percent') {
    return product.price * (1 - applicable.value / 100)
  }
  return Math.max(0, product.price - applicable.value)
}

interface CartSummary {
  subtotal: number
  couponDiscount: number
  total: number
}

interface CartStore {
  items: CartItem[]
  coupon: Coupon | null
  couponError: string | null

  addItem: (product: Product, quantity?: number) => void
  removeItem: (productId: string) => void
  updateQuantity: (productId: string, quantity: number) => void
  applyCoupon: (coupon: Coupon) => void
  removeCoupon: () => void
  clearCart: () => void
  getSummary: () => CartSummary
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      coupon: null,
      couponError: null,

      addItem: (product, quantity = 1) => {
        set((state) => {
          const existing = state.items.find((i) => i.product.id === product.id)
          if (existing) {
            const newQty = existing.quantity + quantity
            return {
              items: state.items.map((i) =>
                i.product.id === product.id
                  ? { ...i, quantity: newQty, unitPrice: applyVolumeDiscount(product, newQty) }
                  : i
              ),
            }
          }
          return {
            items: [
              ...state.items,
              {
                product,
                quantity,
                unitPrice: applyVolumeDiscount(product, quantity),
              },
            ],
          }
        })
      },

      removeItem: (productId) =>
        set((state) => ({ items: state.items.filter((i) => i.product.id !== productId) })),

      updateQuantity: (productId, quantity) => {
        if (quantity <= 0) {
          get().removeItem(productId)
          return
        }
        set((state) => ({
          items: state.items.map((i) =>
            i.product.id === productId
              ? { ...i, quantity, unitPrice: applyVolumeDiscount(i.product, quantity) }
              : i
          ),
        }))
      },

      applyCoupon: (coupon) => {
        const { getSummary } = get()
        const { subtotal } = getSummary()
        if (coupon.minOrderAmount && subtotal < coupon.minOrderAmount) {
          set({ couponError: `Mínimo de compra: $${coupon.minOrderAmount}`, coupon: null })
          return
        }
        set({ coupon, couponError: null })
      },

      removeCoupon: () => set({ coupon: null, couponError: null }),

      clearCart: () => set({ items: [], coupon: null, couponError: null }),

      getSummary: (): CartSummary => {
        const { items, coupon } = get()
        const subtotal = items.reduce((sum, i) => sum + i.unitPrice * i.quantity, 0)
        let couponDiscount = 0
        if (coupon) {
          couponDiscount =
            coupon.type === 'percent'
              ? subtotal * (coupon.value / 100)
              : Math.min(coupon.value, subtotal)
        }
        return {
          subtotal,
          couponDiscount,
          total: Math.max(0, subtotal - couponDiscount),
        }
      },
    }),
    { name: 'cart-store' }
  )
)
```

- [ ] **Step 4: Run tests — expect PASS**

```bash
npm test -- src/__tests__/lib/store/cart.test.ts
```

Expected: All 9 tests passing.

- [ ] **Step 5: Commit**

```bash
git add src/lib/store/ src/__tests__/lib/store/
git commit -m "feat: add Zustand cart store with volume discount and coupon logic"
```

---

### Task 11: Product components

**Files:**
- Create: `src/components/product/ProductCard.tsx`
- Create: `src/components/product/ProductGrid.tsx`

- [ ] **Step 1: Create ProductCard**

Create `src/components/product/ProductCard.tsx`:

```typescript
import Link from 'next/link'
import Image from 'next/image'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardFooter } from '@/components/ui/card'
import { AddToCartButton } from './AddToCartButton'
import type { Product } from '@/lib/data/types'

interface ProductCardProps {
  product: Product
}

export function ProductCard({ product }: ProductCardProps) {
  const hasDiscount = product.compareAtPrice && product.compareAtPrice > product.price
  const discountPct = hasDiscount
    ? Math.round((1 - product.price / product.compareAtPrice!) * 100)
    : 0

  return (
    <Card className="group overflow-hidden">
      <Link href={`/products/${product.slug}`}>
        <div className="relative aspect-square overflow-hidden bg-muted">
          <Image
            src={product.images[0] ?? '/placeholder.png'}
            alt={product.name}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-105"
          />
          {hasDiscount && (
            <Badge className="absolute top-2 left-2 bg-red-500 text-white">
              -{discountPct}%
            </Badge>
          )}
        </div>
      </Link>
      <CardContent className="p-4">
        <Link href={`/products/${product.slug}`}>
          <h3 className="font-medium line-clamp-2 hover:underline">{product.name}</h3>
        </Link>
        <div className="mt-1 flex items-center gap-2">
          <span className="text-lg font-bold">${product.price.toFixed(2)}</span>
          {hasDiscount && (
            <span className="text-sm text-muted-foreground line-through">
              ${product.compareAtPrice!.toFixed(2)}
            </span>
          )}
        </div>
      </CardContent>
      <CardFooter className="p-4 pt-0">
        <AddToCartButton product={product} />
      </CardFooter>
    </Card>
  )
}
```

- [ ] **Step 2: Create AddToCartButton**

Create `src/components/product/AddToCartButton.tsx`:

```typescript
'use client'

import { Button } from '@/components/ui/button'
import { useCartStore } from '@/lib/store/cart'
import type { Product } from '@/lib/data/types'

export function AddToCartButton({ product }: { product: Product }) {
  const addItem = useCartStore((s) => s.addItem)

  return (
    <Button
      className="w-full"
      style={{ backgroundColor: 'var(--brand-primary)' }}
      onClick={() => addItem(product)}
      disabled={product.stock === 0}
    >
      {product.stock === 0 ? 'Sin stock' : 'Agregar al carrito'}
    </Button>
  )
}
```

- [ ] **Step 3: Create ProductGrid**

Create `src/components/product/ProductGrid.tsx`:

```typescript
import { ProductCard } from './ProductCard'
import type { Product } from '@/lib/data/types'

interface ProductGridProps {
  products: Product[]
}

export function ProductGrid({ products }: ProductGridProps) {
  if (products.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
        <p className="text-lg">No se encontraron productos.</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  )
}
```

- [ ] **Step 4: Commit**

```bash
git add src/components/product/
git commit -m "feat: add ProductCard, ProductGrid and AddToCartButton"
```

---

### Task 12: Filter components and catalog page

**Files:**
- Create: `src/components/filters/FilterSidebar.tsx`
- Create: `src/app/(shop)/products/page.tsx`

- [ ] **Step 1: Create FilterSidebar**

Create `src/components/filters/FilterSidebar.tsx`:

```typescript
'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useCallback } from 'react'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import type { Category } from '@/lib/data/types'

interface FilterSidebarProps {
  categories: Category[]
}

export function FilterSidebar({ categories }: FilterSidebarProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const activeCategory = searchParams.get('category') ?? ''

  const setParam = useCallback(
    (key: string, value: string | null) => {
      const params = new URLSearchParams(searchParams.toString())
      if (value) {
        params.set(key, value)
      } else {
        params.delete(key)
      }
      router.push(`/products?${params.toString()}`)
    },
    [router, searchParams]
  )

  return (
    <aside className="w-full md:w-56 shrink-0">
      <div className="space-y-4">
        <div>
          <Label className="text-base font-semibold">Categorías</Label>
          <Separator className="my-2" />
          <ul className="space-y-1">
            <li>
              <button
                onClick={() => setParam('category', null)}
                className={`text-sm w-full text-left px-2 py-1 rounded hover:bg-muted transition-colors ${
                  !activeCategory ? 'font-semibold text-foreground' : 'text-muted-foreground'
                }`}
              >
                Todos
              </button>
            </li>
            {categories.map((cat) => (
              <li key={cat.id}>
                <button
                  onClick={() => setParam('category', cat.slug)}
                  className={`text-sm w-full text-left px-2 py-1 rounded hover:bg-muted transition-colors ${
                    activeCategory === cat.slug
                      ? 'font-semibold text-foreground'
                      : 'text-muted-foreground'
                  }`}
                >
                  {cat.name}
                </button>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </aside>
  )
}
```

- [ ] **Step 2: Create catalog page**

Create `src/app/(shop)/products/page.tsx`:

```typescript
import { Suspense } from 'react'
import { getProducts } from '@/lib/data/products'
import { getCategories } from '@/lib/data/categories'
import { ProductGrid } from '@/components/product/ProductGrid'
import { FilterSidebar } from '@/components/filters/FilterSidebar'
import config from '../../../../client.config'

interface PageProps {
  searchParams: { category?: string; search?: string }
}

export default async function ProductsPage({ searchParams }: PageProps) {
  const [products, categories] = await Promise.all([
    getProducts({
      categorySlug: searchParams.category,
      search: searchParams.search,
    }),
    getCategories(),
  ])

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Productos</h1>
      <div className="flex flex-col md:flex-row gap-8">
        <Suspense>
          <FilterSidebar categories={categories} />
        </Suspense>
        <div className="flex-1">
          {config.features.searchBar && (
            <Suspense>
              <SearchInput defaultValue={searchParams.search} />
            </Suspense>
          )}
          <ProductGrid products={products} />
        </div>
      </div>
    </div>
  )
}

function SearchInput({ defaultValue }: { defaultValue?: string }) {
  return (
    <form className="mb-6">
      <input
        name="search"
        defaultValue={defaultValue}
        placeholder="Buscar productos..."
        className="w-full max-w-sm rounded-md border border-input px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
      />
    </form>
  )
}
```

- [ ] **Step 3: Commit**

```bash
git add src/components/filters/ src/app/\(shop\)/products/
git commit -m "feat: add catalog page with category filters and search"
```

---

### Task 13: Product detail page

**Files:**
- Create: `src/app/(shop)/products/[slug]/page.tsx`

- [ ] **Step 1: Create product detail page**

Create `src/app/(shop)/products/[slug]/page.tsx`:

```typescript
import { notFound } from 'next/navigation'
import Image from 'next/image'
import { getProduct } from '@/lib/data/products'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { AddToCartButton } from '@/components/product/AddToCartButton'

interface PageProps {
  params: { slug: string }
}

export default async function ProductPage({ params }: PageProps) {
  const product = await getProduct(params.slug)

  if (!product) notFound()

  const hasDiscount = product.compareAtPrice && product.compareAtPrice > product.price
  const discountPct = hasDiscount
    ? Math.round((1 - product.price / product.compareAtPrice!) * 100)
    : 0

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
        {/* Images */}
        <div className="relative aspect-square overflow-hidden rounded-lg bg-muted">
          <Image
            src={product.images[0] ?? '/placeholder.png'}
            alt={product.name}
            fill
            className="object-cover"
            priority
          />
          {hasDiscount && (
            <Badge className="absolute top-3 left-3 bg-red-500 text-white text-sm px-2 py-1">
              -{discountPct}%
            </Badge>
          )}
        </div>

        {/* Info */}
        <div className="flex flex-col gap-4">
          <div>
            <p className="text-sm text-muted-foreground">{product.category.name}</p>
            <h1 className="text-3xl font-bold mt-1">{product.name}</h1>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-3xl font-bold">${product.price.toFixed(2)}</span>
            {hasDiscount && (
              <span className="text-lg text-muted-foreground line-through">
                ${product.compareAtPrice!.toFixed(2)}
              </span>
            )}
          </div>

          {product.volumeDiscounts.length > 0 && (
            <div className="rounded-md bg-muted p-3 text-sm space-y-1">
              <p className="font-medium">Descuentos por volumen:</p>
              {product.volumeDiscounts
                .sort((a, b) => a.minQty - b.minQty)
                .map((d) => (
                  <p key={d.id} className="text-muted-foreground">
                    • {d.minQty}+ unidades:{' '}
                    {d.type === 'percent' ? `${d.value}% off` : `$${d.value} off c/u`}
                  </p>
                ))}
            </div>
          )}

          <Separator />

          <p className="text-muted-foreground leading-relaxed">{product.description}</p>

          <p className="text-sm text-muted-foreground">
            Stock disponible: <span className="font-medium text-foreground">{product.stock}</span>
          </p>

          <AddToCartButton product={product} />
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/\(shop\)/products/\[slug\]/
git commit -m "feat: add product detail page with volume discount display"
```

---

### Task 14: Cart components and cart page

**Files:**
- Create: `src/components/cart/CartSummary.tsx`
- Create: `src/components/cart/CouponInput.tsx`
- Create: `src/components/cart/CartItem.tsx`
- Create: `src/app/(shop)/cart/page.tsx`

- [ ] **Step 1: Create coupon validation API route**

Create `src/app/api/coupon/validate/route.ts`:

```typescript
import { NextResponse } from 'next/server'
import { validateCoupon } from '@/lib/data/coupons'

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const code = searchParams.get('code')
  if (!code) return NextResponse.json(null)

  const coupon = await validateCoupon(code)
  return NextResponse.json(coupon)
}
```

- [ ] **Step 2: Create CouponInput**

Create `src/components/cart/CouponInput.tsx`:

```typescript
'use client'

import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { useCartStore } from '@/lib/store/cart'

export function CouponInput() {
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)
  const { coupon, couponError, applyCoupon, removeCoupon } = useCartStore()

  async function handleApply() {
    if (!code.trim()) return
    setLoading(true)
    try {
      const res = await fetch(`/api/coupon/validate?code=${encodeURIComponent(code.trim())}`)
      const result = await res.json()
      if (!result) {
        useCartStore.setState({ couponError: 'Cupón inválido o expirado', coupon: null })
      } else {
        applyCoupon(result)
      }
    } finally {
      setLoading(false)
    }
  }

  if (coupon) {
    return (
      <div className="flex items-center justify-between text-sm">
        <span className="text-green-600 font-medium">Cupón {coupon.code} aplicado</span>
        <Button variant="ghost" size="sm" onClick={removeCoupon}>
          Quitar
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <Input
          placeholder="Código de descuento"
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          className="flex-1"
        />
        <Button onClick={handleApply} disabled={loading} variant="outline">
          {loading ? '...' : 'Aplicar'}
        </Button>
      </div>
      {couponError && <p className="text-xs text-red-500">{couponError}</p>}
    </div>
  )
}
```

- [ ] **Step 2: Create CartSummary**

Create `src/components/cart/CartSummary.tsx`:

```typescript
'use client'

import { Separator } from '@/components/ui/separator'
import { Button } from '@/components/ui/button'
import { useCartStore } from '@/lib/store/cart'
import { CouponInput } from './CouponInput'
import Link from 'next/link'
import config from '../../../client.config'

export function CartSummary() {
  const { getSummary, coupon } = useCartStore()
  const { subtotal, couponDiscount, total } = getSummary()

  return (
    <div className="rounded-lg border p-6 space-y-4 bg-muted/30">
      <h2 className="text-lg font-semibold">Resumen del pedido</h2>

      <div className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-muted-foreground">Subtotal</span>
          <span>${subtotal.toFixed(2)}</span>
        </div>
        {couponDiscount > 0 && (
          <div className="flex justify-between text-green-600">
            <span>Descuento ({coupon?.code})</span>
            <span>-${couponDiscount.toFixed(2)}</span>
          </div>
        )}
      </div>

      <Separator />

      <div className="flex justify-between font-bold text-base">
        <span>Total</span>
        <span>${total.toFixed(2)}</span>
      </div>

      {config.discounts.couponsEnabled && <CouponInput />}

      <Button className="w-full" style={{ backgroundColor: 'var(--brand-primary)' }} asChild>
        <Link href="/checkout">Ir al checkout</Link>
      </Button>
    </div>
  )
}
```

- [ ] **Step 3: Create CartItem**

Create `src/components/cart/CartItem.tsx`:

```typescript
'use client'

import Image from 'next/image'
import { Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useCartStore } from '@/lib/store/cart'
import type { CartItem as CartItemType } from '@/lib/data/types'

export function CartItem({ item }: { item: CartItemType }) {
  const { updateQuantity, removeItem } = useCartStore()
  const lineTotal = item.unitPrice * item.quantity
  const hasVolumeDiscount = item.unitPrice < item.product.price

  return (
    <div className="flex gap-4 py-4 border-b last:border-0">
      <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-md bg-muted">
        <Image
          src={item.product.images[0] ?? '/placeholder.png'}
          alt={item.product.name}
          fill
          className="object-cover"
        />
      </div>
      <div className="flex flex-1 flex-col gap-1">
        <p className="font-medium">{item.product.name}</p>
        <div className="text-sm text-muted-foreground">
          {hasVolumeDiscount ? (
            <span className="text-green-600">${item.unitPrice.toFixed(2)} c/u (descuento vol.)</span>
          ) : (
            <span>${item.unitPrice.toFixed(2)} c/u</span>
          )}
        </div>
        <div className="flex items-center gap-2 mt-1">
          <Button
            variant="outline"
            size="icon"
            className="h-6 w-6"
            onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
          >
            -
          </Button>
          <span className="text-sm w-6 text-center">{item.quantity}</span>
          <Button
            variant="outline"
            size="icon"
            className="h-6 w-6"
            onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
            disabled={item.quantity >= item.product.stock}
          >
            +
          </Button>
        </div>
      </div>
      <div className="flex flex-col items-end justify-between">
        <span className="font-semibold">${lineTotal.toFixed(2)}</span>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-muted-foreground hover:text-destructive"
          onClick={() => removeItem(item.product.id)}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Create cart page**

Create `src/app/(shop)/cart/page.tsx`:

```typescript
'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { useCartStore } from '@/lib/store/cart'
import { CartItem } from '@/components/cart/CartItem'
import { CartSummary } from '@/components/cart/CartSummary'

export default function CartPage() {
  const items = useCartStore((s) => s.items)

  if (items.length === 0) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <p className="text-lg text-muted-foreground mb-4">Tu carrito está vacío.</p>
        <Button asChild>
          <Link href="/products">Ver productos</Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Tu carrito</h1>
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2">
          {items.map((item) => (
            <CartItem key={item.product.id} item={item} />
          ))}
        </div>
        <div>
          <CartSummary />
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 7: Commit**

```bash
git add src/components/cart/ src/app/\(shop\)/cart/ src/app/api/coupon/
git commit -m "feat: add cart page with item management and coupon input"
```

---

### Task 15: Checkout adapters

**Files:**
- Create: `src/lib/checkout/types.ts`
- Create: `src/lib/checkout/whatsapp.ts`
- Create: `src/lib/checkout/qr.ts`
- Create: `src/lib/checkout/placeholder.ts`
- Create: `src/lib/checkout/index.ts`
- Create: `src/__tests__/lib/checkout/whatsapp.test.ts`

- [ ] **Step 1: Write failing test for WhatsApp adapter**

Create `src/__tests__/lib/checkout/whatsapp.test.ts`:

```typescript
import { WhatsAppAdapter } from '@/lib/checkout/whatsapp'
import type { CartItem } from '@/lib/data/types'

const mockItem: CartItem = {
  product: {
    id: 'p1', slug: 'test', name: 'Camiseta', description: '', images: [],
    price: 25, compareAtPrice: null, stock: 10, categoryId: 'c1',
    category: { id: 'c1', slug: 'ropa', name: 'Ropa' }, volumeDiscounts: [],
  },
  quantity: 2,
  unitPrice: 25,
}

describe('WhatsAppAdapter', () => {
  it('formats message with items and total', () => {
    const adapter = new WhatsAppAdapter({
      number: '+521234567890',
      messageTemplate: 'Hola! Quiero pedir:\n{items}\nTotal: {total}',
    })
    const message = adapter.formatMessage([mockItem], 50)
    expect(message).toContain('Camiseta')
    expect(message).toContain('x2')
    expect(message).toContain('50.00')
  })

  it('builds correct wa.me URL', () => {
    const adapter = new WhatsAppAdapter({
      number: '+521234567890',
      messageTemplate: '{items}\nTotal: {total}',
    })
    const url = adapter.buildUrl([mockItem], 50)
    expect(url).toMatch(/^https:\/\/wa\.me\/521234567890/)
  })
})
```

- [ ] **Step 2: Run — expect FAIL**

```bash
npm test -- src/__tests__/lib/checkout/whatsapp.test.ts
```

Expected: FAIL — `Cannot find module '@/lib/checkout/whatsapp'`

- [ ] **Step 3: Implement checkout types**

Create `src/lib/checkout/types.ts`:

```typescript
import type { CartItem, Customer } from '@/lib/data/types'

export interface CheckoutAdapter {
  name: string
  handleCheckout(items: CartItem[], total: number, customer?: Customer): Promise<void>
}
```

- [ ] **Step 4: Implement WhatsApp adapter**

Create `src/lib/checkout/whatsapp.ts`:

```typescript
import type { CartItem } from '@/lib/data/types'
import type { CheckoutAdapter } from './types'
import type { Customer } from '@/lib/data/types'

interface WhatsAppConfig {
  number: string
  messageTemplate: string
}

export class WhatsAppAdapter implements CheckoutAdapter {
  name = 'whatsapp'
  private config: WhatsAppConfig

  constructor(config: WhatsAppConfig) {
    this.config = config
  }

  formatMessage(items: CartItem[], total: number): string {
    const itemLines = items
      .map((i) => `• ${i.product.name} x${i.quantity} — $${(i.unitPrice * i.quantity).toFixed(2)}`)
      .join('\n')

    return this.config.messageTemplate
      .replace('{items}', itemLines)
      .replace('{total}', total.toFixed(2))
  }

  buildUrl(items: CartItem[], total: number): string {
    const number = this.config.number.replace(/\D/g, '')
    const message = encodeURIComponent(this.formatMessage(items, total))
    return `https://wa.me/${number}?text=${message}`
  }

  async handleCheckout(items: CartItem[], total: number): Promise<void> {
    window.open(this.buildUrl(items, total), '_blank')
  }
}
```

- [ ] **Step 5: Run — expect PASS**

```bash
npm test -- src/__tests__/lib/checkout/whatsapp.test.ts
```

Expected: 2 tests passing.

- [ ] **Step 6: Implement remaining adapters**

Create `src/lib/checkout/qr.ts`:

```typescript
import type { CartItem } from '@/lib/data/types'
import type { CheckoutAdapter } from './types'

interface QRConfig {
  imageUrl: string
  instructions: string
  onShow: (imageUrl: string, instructions: string) => void
}

export class QRAdapter implements CheckoutAdapter {
  name = 'qr'
  private config: QRConfig

  constructor(config: QRConfig) {
    this.config = config
  }

  async handleCheckout(_items: CartItem[], _total: number): Promise<void> {
    this.config.onShow(this.config.imageUrl, this.config.instructions)
  }
}
```

Create `src/lib/checkout/placeholder.ts`:

```typescript
import type { CartItem } from '@/lib/data/types'
import type { CheckoutAdapter } from './types'

export class PlaceholderAdapter implements CheckoutAdapter {
  name = 'payment'

  async handleCheckout(_items: CartItem[], _total: number): Promise<void> {
    alert('Sistema de pagos próximamente disponible.')
  }
}
```

Create `src/lib/checkout/index.ts`:

```typescript
import config from '../../../client.config'
import { WhatsAppAdapter } from './whatsapp'
import { PlaceholderAdapter } from './placeholder'
import type { CheckoutAdapter } from './types'

export function getCheckoutAdapter(onShowQR?: (img: string, instructions: string) => void): CheckoutAdapter {
  switch (config.checkout.mode) {
    case 'whatsapp':
      return new WhatsAppAdapter(config.whatsapp)
    case 'qr': {
      const { QRAdapter } = require('./qr')
      return new QRAdapter({
        imageUrl: config.checkout.qr?.imageUrl ?? '',
        instructions: config.checkout.qr?.instructions ?? '',
        onShow: onShowQR ?? (() => {}),
      })
    }
    case 'payment':
    default:
      return new PlaceholderAdapter()
  }
}

export type { CheckoutAdapter }
```

- [ ] **Step 7: Commit**

```bash
git add src/lib/checkout/ src/__tests__/lib/checkout/
git commit -m "feat: add pluggable checkout adapters (WhatsApp, QR, placeholder)"
```

---

### Task 16: Checkout page

**Files:**
- Create: `src/app/(shop)/checkout/page.tsx`

- [ ] **Step 1: Create checkout page**

Create `src/app/(shop)/checkout/page.tsx`:

```typescript
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { useCartStore } from '@/lib/store/cart'
import { getCheckoutAdapter } from '@/lib/checkout'
import config from '../../../../client.config'

export default function CheckoutPage() {
  const router = useRouter()
  const { items, getSummary, clearCart } = useCartStore()
  const { subtotal, couponDiscount, total } = getSummary()

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [qrModal, setQrModal] = useState<{ imageUrl: string; instructions: string } | null>(null)

  if (items.length === 0) {
    router.replace('/cart')
    return null
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)

    try {
      const adapter = getCheckoutAdapter((imageUrl, instructions) => {
        setQrModal({ imageUrl, instructions })
      })

      await adapter.handleCheckout(items, total, { name, email })

      if (config.checkout.mode === 'whatsapp') {
        clearCart()
        router.push('/')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto max-w-2xl px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Checkout</h1>

      <div className="rounded-lg border p-6 mb-6 space-y-2 text-sm">
        {items.map((item) => (
          <div key={item.product.id} className="flex justify-between">
            <span>{item.product.name} x{item.quantity}</span>
            <span>${(item.unitPrice * item.quantity).toFixed(2)}</span>
          </div>
        ))}
        <Separator className="my-2" />
        {couponDiscount > 0 && (
          <div className="flex justify-between text-green-600">
            <span>Descuento</span>
            <span>-${couponDiscount.toFixed(2)}</span>
          </div>
        )}
        <div className="flex justify-between font-bold text-base">
          <span>Total</span>
          <span>${total.toFixed(2)}</span>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="name">Nombre completo</Label>
          <Input
            id="name"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Tu nombre"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="tu@email.com"
          />
        </div>

        <Button
          type="submit"
          className="w-full"
          style={{ backgroundColor: 'var(--brand-primary)' }}
          disabled={loading}
        >
          {loading
            ? 'Procesando...'
            : config.checkout.mode === 'whatsapp'
            ? 'Confirmar pedido por WhatsApp'
            : config.checkout.mode === 'qr'
            ? 'Ver QR de pago'
            : 'Confirmar pedido'}
        </Button>
      </form>

      {/* QR Modal */}
      <Dialog open={!!qrModal} onOpenChange={() => setQrModal(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Pago con QR</DialogTitle>
          </DialogHeader>
          {qrModal && (
            <div className="flex flex-col items-center gap-4 py-4">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={qrModal.imageUrl} alt="QR de pago" className="w-48 h-48 object-contain" />
              <p className="text-sm text-center text-muted-foreground">{qrModal.instructions}</p>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/\(shop\)/checkout/
git commit -m "feat: add checkout page with WhatsApp and QR support"
```

---

### Task 17: Auth (NextAuth + login + register)

**Files:**
- Create: `src/app/api/auth/[...nextauth]/route.ts`
- Create: `src/lib/auth.ts`
- Create: `src/app/(auth)/layout.tsx`
- Create: `src/app/(auth)/login/page.tsx`
- Create: `src/app/(auth)/register/page.tsx`
- Create: `src/app/api/auth/register/route.ts`

- [ ] **Step 1: Create NextAuth config**

Create `src/lib/auth.ts`:

```typescript
import type { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/db'

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Contraseña', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null

        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
        })
        if (!user) return null

        const valid = await bcrypt.compare(credentials.password, user.password)
        if (!valid) return null

        return { id: user.id, email: user.email, name: user.name }
      },
    }),
  ],
  session: { strategy: 'jwt' },
  pages: {
    signIn: '/login',
  },
}
```

- [ ] **Step 2: Create NextAuth route handler**

Create `src/app/api/auth/[...nextauth]/route.ts`:

```typescript
import NextAuth from 'next-auth'
import { authOptions } from '@/lib/auth'

const handler = NextAuth(authOptions)
export { handler as GET, handler as POST }
```

- [ ] **Step 3: Create register API route**

Create `src/app/api/auth/register/route.ts`:

```typescript
import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/db'

export async function POST(req: Request) {
  const { name, email, password } = await req.json()

  if (!name || !email || !password) {
    return NextResponse.json({ error: 'Todos los campos son requeridos' }, { status: 400 })
  }

  const existing = await prisma.user.findUnique({ where: { email } })
  if (existing) {
    return NextResponse.json({ error: 'El email ya está registrado' }, { status: 409 })
  }

  const hash = await bcrypt.hash(password, 10)
  await prisma.user.create({ data: { name, email, password: hash } })

  return NextResponse.json({ ok: true })
}
```

- [ ] **Step 4: Create auth layout**

Create `src/app/(auth)/layout.tsx`:

```typescript
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30 px-4">
      {children}
    </div>
  )
}
```

- [ ] **Step 5: Create login page**

Create `src/app/(auth)/login/page.tsx`:

```typescript
'use client'

import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import config from '../../../../client.config'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const result = await signIn('credentials', {
      email,
      password,
      redirect: false,
    })

    setLoading(false)

    if (result?.error) {
      setError('Email o contraseña incorrectos')
    } else {
      router.push('/')
    }
  }

  return (
    <Card className="w-full max-w-sm">
      <CardHeader>
        <CardTitle className="text-center">{config.name}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Contraseña</Label>
            <Input
              id="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          {error && <p className="text-sm text-red-500">{error}</p>}
          <Button
            type="submit"
            className="w-full"
            style={{ backgroundColor: 'var(--brand-primary)' }}
            disabled={loading}
          >
            {loading ? 'Ingresando...' : 'Ingresar'}
          </Button>
          <p className="text-center text-sm text-muted-foreground">
            ¿No tienes cuenta?{' '}
            <Link href="/register" className="underline">
              Registrarse
            </Link>
          </p>
        </form>
      </CardContent>
    </Card>
  )
}
```

- [ ] **Step 6: Create register page**

Create `src/app/(auth)/register/page.tsx`:

```typescript
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import config from '../../../../client.config'

export default function RegisterPage() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password }),
    })

    const data = await res.json()
    setLoading(false)

    if (!res.ok) {
      setError(data.error ?? 'Error al registrarse')
    } else {
      router.push('/login')
    }
  }

  return (
    <Card className="w-full max-w-sm">
      <CardHeader>
        <CardTitle className="text-center">Crear cuenta en {config.name}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nombre</Label>
            <Input
              id="name"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Contraseña</Label>
            <Input
              id="password"
              type="password"
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          {error && <p className="text-sm text-red-500">{error}</p>}
          <Button
            type="submit"
            className="w-full"
            style={{ backgroundColor: 'var(--brand-primary)' }}
            disabled={loading}
          >
            {loading ? 'Registrando...' : 'Registrarse'}
          </Button>
          <p className="text-center text-sm text-muted-foreground">
            ¿Ya tienes cuenta?{' '}
            <Link href="/login" className="underline">
              Ingresar
            </Link>
          </p>
        </form>
      </CardContent>
    </Card>
  )
}
```

- [ ] **Step 7: Add SessionProvider to root layout**

Update `src/app/layout.tsx` to wrap with NextAuth SessionProvider:

```typescript
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import config from '../../client.config'
import { Providers } from './providers'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: config.name,
  description: config.tagline,
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <head>
        <style>{`
          :root {
            --brand-primary: ${config.theme.primary};
            --brand-bg: ${config.theme.background};
          }
        `}</style>
      </head>
      <body className={inter.className}>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
```

Create `src/app/providers.tsx`:

```typescript
'use client'

import { SessionProvider } from 'next-auth/react'

export function Providers({ children }: { children: React.ReactNode }) {
  return <SessionProvider>{children}</SessionProvider>
}
```

- [ ] **Step 8: Commit**

```bash
git add src/app/api/auth/ src/app/\(auth\)/ src/lib/auth.ts src/app/providers.tsx src/app/layout.tsx
git commit -m "feat: add NextAuth with credentials provider, login and register pages"
```

---

### Task 18: Home page

**Files:**
- Create: `src/app/(shop)/page.tsx`

- [ ] **Step 1: Create home page**

Create `src/app/(shop)/page.tsx`:

```typescript
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { getProducts } from '@/lib/data/products'
import { ProductGrid } from '@/components/product/ProductGrid'
import config from '../../../client.config'

export default async function HomePage() {
  const featured = await getProducts()
  const featuredSlice = featured.slice(0, 4)

  return (
    <div>
      {/* Hero */}
      <section
        className="py-20 px-4 text-center"
        style={{ backgroundColor: config.theme.primary + '15' }}
      >
        <h1 className="text-4xl font-bold mb-4" style={{ color: config.theme.primary }}>
          {config.name}
        </h1>
        <p className="text-lg text-muted-foreground mb-8 max-w-xl mx-auto">
          {config.tagline}
        </p>
        <Button size="lg" asChild style={{ backgroundColor: config.theme.primary }}>
          <Link href="/products">Ver productos</Link>
        </Button>
      </section>

      {/* Featured products */}
      <section className="container mx-auto px-4 py-12">
        <h2 className="text-2xl font-bold mb-6">Productos destacados</h2>
        <ProductGrid products={featuredSlice} />
        <div className="mt-8 text-center">
          <Button variant="outline" asChild>
            <Link href="/products">Ver todos</Link>
          </Button>
        </div>
      </section>
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/\(shop\)/page.tsx
git commit -m "feat: add home page with hero and featured products"
```

---

### Task 19: CLAUDE.md, CUSTOMIZATION.md and final run

**Files:**
- Create: `CLAUDE.md`
- Create: `docs/CUSTOMIZATION.md`
- Create: `README.md`

- [ ] **Step 1: Create CLAUDE.md**

Create `CLAUDE.md` in project root:

```markdown
# CLAUDE.md — E-commerce Template

This file tells AI assistants (Claude, Copilot, etc.) how to work with this template.

## What this project is

A Next.js + TypeScript e-commerce template. Cloned once per client, customized via `client.config.ts`.
Stack: Next.js App Router, TypeScript, Tailwind, shadcn/ui, PostgreSQL (Docker), Prisma, Zustand, NextAuth.

## Starting local development

1. `docker compose up -d`          — start PostgreSQL
2. `npx prisma migrate dev`         — apply migrations
3. `npx prisma db seed`             — load sample data
4. `npm run dev`                    — start Next.js at http://localhost:3000

## Customizing for a new client

Edit ONE file: `client.config.ts`

| Field | Effect |
|---|---|
| `name`, `tagline` | Site title and subtitle |
| `theme.primary` | Main brand color (hex) |
| `theme.font` | Google Font name |
| `whatsapp.number` | WhatsApp number for orders |
| `checkout.mode` | `"whatsapp"`, `"qr"`, or `"payment"` |
| `discounts.couponsEnabled` | Show/hide coupon input |
| `features.auth` | Show/hide login/register |

Replace files in `public/client/`: `logo.png`, `favicon.ico`, `qr-pago.png`.

## Files you MUST NOT change without understanding them

- `prisma/schema.prisma` — changing models requires a new migration
- `src/lib/data/types.ts` — breaking these types breaks everything
- `src/lib/checkout/types.ts` — `CheckoutAdapter` interface contract
- `src/lib/store/cart.ts` — discount logic is tested; edit carefully

## Adding a new checkout payment method

1. Create `src/lib/checkout/your-method.ts` implementing `CheckoutAdapter`
2. Add a `case` in `src/lib/checkout/index.ts`
3. Add the new mode to `ClientConfig.checkout.mode` in `client.config.ts`

## Adding a new Prisma model

1. Add model to `prisma/schema.prisma`
2. Run `npx prisma migrate dev --name your-model`
3. Add types to `src/lib/data/types.ts`
4. Create `src/lib/data/your-model.ts` with query functions
5. Use functions in server components or API routes (never import `prisma` in components)

## Common tasks

**Change brand color:** Edit `theme.primary` in `client.config.ts`

**Add a coupon:** Use Prisma Studio (`npx prisma studio`) or add to `prisma/seed.ts`

**Add seed products:** Edit `prisma/seed.ts` and re-run `npx prisma db seed`

**Switch to QR checkout:**
```typescript
checkout: {
  mode: 'qr',
  qr: { imageUrl: '/client/qr-pago.png', instructions: 'Escanea y manda comprobante' }
}
```

**Disable auth:** Set `features.auth: false` in `client.config.ts`

## Running tests

```bash
npm test            # run all tests
npm run test:watch  # watch mode
```
```

- [ ] **Step 2: Create CUSTOMIZATION.md**

Create `docs/CUSTOMIZATION.md`:

```markdown
# Customization Guide

## Quick start for a new client

1. Clone this repo
2. Edit `client.config.ts` with client details
3. Replace `public/client/logo.png` with client logo (square, min 200×200px)
4. Replace `public/client/favicon.ico`
5. Run `docker compose up -d && npx prisma migrate dev && npx prisma db seed`
6. Run `npm run dev` to preview

## Checkout modes

### WhatsApp (default)
Orders go to a WhatsApp number. Set `checkout.mode: "whatsapp"` and `whatsapp.number`.

### QR
Show a QR code for payment. Set `checkout.mode: "qr"` and provide `checkout.qr.imageUrl`.
Place the QR image at `public/client/qr-pago.png`.

### Custom payment (coming soon)
Set `checkout.mode: "payment"` — currently shows a placeholder.

## Discounts

- **Precio tachado:** set `compareAtPrice` on a product (via Prisma Studio or seed)
- **Cupones:** add rows to the `Coupon` table in Prisma Studio
- **Descuentos por volumen:** add `VolumeDiscount` rows linked to a product

## Adding products

Use Prisma Studio: `npx prisma studio` → open `Product` table → add row.

## Deploying

1. Set up a PostgreSQL database (e.g. Supabase, Railway, Neon)
2. Set `DATABASE_URL` in environment variables
3. Run `npx prisma migrate deploy`
4. Deploy to Vercel or any Node.js host
```

- [ ] **Step 3: Create README.md**

Create `README.md`:

```markdown
# E-commerce Template

A production-ready, client-customizable e-commerce template.

## Stack

- **Next.js 14** (App Router) + TypeScript
- **Tailwind CSS** + shadcn/ui
- **PostgreSQL** (Docker) + Prisma
- **Zustand** for cart state
- **NextAuth v4** for authentication

## Features

- Product catalog with category filters and search
- Product detail pages with volume discount display
- Cart with coupon codes and volume discounts
- Pluggable checkout: WhatsApp redirect, QR payment, or custom platform
- Auth: login and register with credentials
- Single `client.config.ts` for all per-client customization

## Quick start

```bash
# 1. Install dependencies
npm install

# 2. Copy env and fill in values
cp .env.example .env

# 3. Start PostgreSQL
docker compose up -d

# 4. Apply schema and seed data
npx prisma migrate dev
npx prisma db seed

# 5. Start dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

Demo credentials: `demo@example.com` / `password123`

## Customization

See [docs/CUSTOMIZATION.md](docs/CUSTOMIZATION.md) or `CLAUDE.md` for AI-assisted customization.
```

- [ ] **Step 4: Run full test suite**

```bash
npm test
```

Expected: All tests passing with no errors.

- [ ] **Step 5: Run dev server and verify**

```bash
npm run dev
```

Open `http://localhost:3000` and verify:
- Home page loads with hero and product grid
- `/products` shows catalog with category filters
- Clicking a product opens its detail page
- "Agregar al carrito" adds to cart (badge updates in header)
- `/cart` shows items with quantity controls and coupon input
- `/checkout` shows order summary and submit button
- `/login` and `/register` render correctly

- [ ] **Step 6: Final commit**

```bash
git add CLAUDE.md docs/ README.md
git commit -m "docs: add CLAUDE.md, CUSTOMIZATION.md and README"
```

---

## Summary

| Task | Deliverable |
|---|---|
| 1 | Next.js project scaffolded, Jest configured |
| 2 | Docker + PostgreSQL running, .env set up |
| 3 | Prisma schema with all models, migration applied |
| 4 | `client.config.ts` with full TypeScript types |
| 5 | Prisma singleton + shared app types |
| 6 | Data access layer (products, categories, coupons) + tests |
| 7 | Seed data: 5 products, 3 categories, 2 coupons, 1 user |
| 8 | shadcn/ui initialized, theme CSS variables wired to config |
| 9 | Header, Footer, shop layout |
| 10 | Cart store with volume discounts + coupon logic + tests |
| 11 | ProductCard, ProductGrid, AddToCartButton |
| 12 | Catalog page with category filters and search |
| 13 | Product detail page with volume discount table |
| 14 | Cart page with CartItem, CartSummary, CouponInput |
| 15 | Checkout adapters (WhatsApp, QR, placeholder) + tests |
| 16 | Checkout page with QR modal |
| 17 | NextAuth, login/register pages, register API |
| 18 | Home page with hero and featured products |
| 19 | CLAUDE.md, CUSTOMIZATION.md, README |
