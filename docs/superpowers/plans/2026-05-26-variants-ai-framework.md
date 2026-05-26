# Variants + AI Framework — Implementation Plan A

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add Shopify-style product variants (N option axes, price/stock per variant) and a business-type AI framework to the existing e-commerce template.

**Architecture:** Every product gains `options[]` + `variants[]`; price and stock move entirely to `ProductVariant`. The `VariantSelector` component is generic — it renders whatever option axes a product defines. Four `BusinessType` profiles (clothing/footwear/electronics/food) drive seed data and a CLI setup wizard.

**Tech Stack:** Next.js 16 App Router, Prisma 7 (PrismaPg adapter), PostgreSQL 5437, Zustand 5, TypeScript, shadcn/ui, @inquirer/prompts

**Spec:** `docs/superpowers/specs/2026-05-26-variants-admin-ai-framework.md`

---

## File Map

| File | Action |
|---|---|
| `prisma/schema.prisma` | Add ProductOption, ProductOptionValue, ProductVariant; modify Product, User, OrderItem |
| `prisma/migrations/<timestamp>_add_variants/migration.sql` | Generated + edited to include data migration SQL |
| `src/lib/data/types.ts` | Add variant types; update Product, CartItem |
| `src/lib/data/products.ts` | Update queries + mapProduct() |
| `src/__tests__/lib/data/products.test.ts` | Update mocks + add variant filter test |
| `src/lib/store/cart.ts` | New addItem(product, variant, qty) API; keyed by variantId |
| `src/__tests__/lib/store/cart.test.ts` | Update all tests to new API |
| `src/components/cart/CartItem.tsx` | Use variant.id, variant.stock, basePrice |
| `src/components/product/ProductCard.tsx` | Show "Desde $X" for multi-price products |
| `src/components/product/AddToCartButton.tsx` | Accept optional variant prop |
| `src/components/product/VariantSelector.tsx` | New generic component |
| `src/components/product/ProductInfo.tsx` | New client component with variant state |
| `src/app/(shop)/products/[slug]/page.tsx` | Pass product to ProductInfo |
| `src/lib/checkout/whatsapp.ts` | Include variantLabel in message |
| `src/__tests__/components/product/VariantSelector.test.tsx` | New tests |
| `business-types/base.ts` | BusinessType interface |
| `business-types/clothing.ts` | Ropa profile |
| `business-types/footwear.ts` | Zapatería profile |
| `business-types/electronics.ts` | Electrónica profile |
| `business-types/food.ts` | Comida/Nutrición profile |
| `business-types/index.ts` | Registry |
| `scripts/setup.ts` | CLI wizard |
| `prisma/seed.ts` | Rewrite to use BusinessType profiles |
| `package.json` | Add `setup` script |
| `CLAUDE.md` | Add AI Quick Setup section |

---

## Task 1: Install dependency + Update Prisma schema

**Files:**
- Modify: `prisma/schema.prisma`

- [ ] **Step 1: Install @inquirer/prompts**

```bash
npm install @inquirer/prompts
```

Expected: added to `package.json` dependencies.

- [ ] **Step 2: Replace `prisma/schema.prisma` with the new schema**

The full new schema (keep existing generator/datasource/VolumeDiscount/Coupon/Order unchanged):

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
  categoryId      String
  category        Category         @relation(fields: [categoryId], references: [id])
  volumeDiscounts VolumeDiscount[]
  orderItems      OrderItem[]
  options         ProductOption[]
  variants        ProductVariant[]
  createdAt       DateTime         @default(now())
  updatedAt       DateTime         @updatedAt
}

model ProductOption {
  id        String               @id @default(cuid())
  productId String
  product   Product              @relation(fields: [productId], references: [id], onDelete: Cascade)
  name      String
  position  Int                  @default(0)
  values    ProductOptionValue[]
}

model ProductOptionValue {
  id       String           @id @default(cuid())
  optionId String
  option   ProductOption    @relation(fields: [optionId], references: [id], onDelete: Cascade)
  value    String
  position Int              @default(0)
  variants ProductVariant[] @relation("VariantOptionValues")
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
  role      String   @default("user")
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
  id           String          @id @default(cuid())
  orderId      String
  order        Order           @relation(fields: [orderId], references: [id], onDelete: Cascade)
  productId    String
  product      Product         @relation(fields: [productId], references: [id])
  variantId    String?
  variant      ProductVariant? @relation(fields: [variantId], references: [id])
  variantLabel String?
  quantity     Int
  unitPrice    Decimal         @db.Decimal(10, 2)
}
```

- [ ] **Step 3: Commit schema change**

```bash
git add prisma/schema.prisma package.json package-lock.json
git commit -m "feat: add variant schema models and install @inquirer/prompts"
```

---

## Task 2: Run data migration

**Files:**
- Modify: `prisma/migrations/<generated>/migration.sql`

This task creates and applies the migration that moves price/stock from Product to ProductVariant. The key requirement: INSERT Default variants for existing products BEFORE dropping the columns.

- [ ] **Step 1: Generate migration without applying**

```bash
npx prisma migrate dev --name add-variants --create-only
```

Expected: A new file created at `prisma/migrations/<timestamp>_add_variants/migration.sql`. The exact timestamp prefix is auto-generated.

- [ ] **Step 2: Locate the migration file**

```bash
ls prisma/migrations/
```

Note the name of the new directory (e.g. `20260526120000_add_variants`). Open its `migration.sql`.

- [ ] **Step 3: Edit the migration SQL**

Find the line that drops the `price` column from `Product` (it looks like):
```sql
ALTER TABLE "Product" DROP COLUMN "price";
```

Insert the following data migration block **immediately before** the first `DROP COLUMN` line:

```sql
-- Data migration: create Default variant for every existing product before dropping columns
INSERT INTO "ProductVariant" ("id", "productId", "sku", "price", "compareAtPrice", "stock", "createdAt")
SELECT
  'default_' || "id",
  "id",
  NULL,
  "price",
  "compareAtPrice",
  "stock",
  NOW()
FROM "Product";
```

- [ ] **Step 4: Apply the migration**

```bash
npx prisma migrate dev
```

Expected output: `The following migration(s) have been applied: ...add_variants` with no errors. If it fails, check that the INSERT is before the DROP COLUMN statements.

- [ ] **Step 5: Verify with Prisma Studio**

```bash
npx prisma studio
```

Open `ProductVariant` table — should contain one row per existing product with `id` prefixed `default_` and `sku` = NULL.

- [ ] **Step 6: Commit**

```bash
git add prisma/migrations/
git commit -m "feat: apply data migration for product variants"
```

---

## Task 3: Update TypeScript types

**Files:**
- Modify: `src/lib/data/types.ts`

- [ ] **Step 1: Replace `src/lib/data/types.ts` entirely**

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

export interface Product {
  id: string
  slug: string
  name: string
  description: string
  images: string[]
  categoryId: string
  category: Category
  volumeDiscounts: VolumeDiscount[]
  options: ProductOption[]
  variants: ProductVariant[]
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
  variant: ProductVariant
  variantLabel: string       // "Talle: M / Color: Rojo" or "Default"
  quantity: number
  unitPrice: number          // after volume discount
  basePrice: number          // variant.price before discount
}

export interface Customer {
  name: string
  email: string
  phone?: string
}
```

- [ ] **Step 2: Check TypeScript compilation**

```bash
npx tsc --noEmit
```

Expected: Many errors about `product.price`, `product.stock`, `item.product.id` in cart — these are fixed in subsequent tasks. It is normal at this stage. The key check is that `types.ts` itself is error-free.

- [ ] **Step 3: Commit**

```bash
git add src/lib/data/types.ts
git commit -m "feat: add variant types to types.ts"
```

---

## Task 4: Update data access layer

**Files:**
- Modify: `src/lib/data/products.ts`
- Modify: `src/__tests__/lib/data/products.test.ts`

- [ ] **Step 1: Write the failing tests first**

Replace `src/__tests__/lib/data/products.test.ts` with:

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

const mockVariant = {
  id: 'var1',
  productId: 'p1',
  sku: null,
  price: { toNumber: () => 25.0 },
  compareAtPrice: null,
  stock: 10,
  optionValues: [],
  createdAt: new Date(),
}

const mockProduct = {
  id: 'p1',
  slug: 'camiseta-blanca',
  name: 'Camiseta Blanca',
  description: 'Camiseta de algodón',
  images: ['/img/camiseta.jpg'],
  categoryId: 'c1',
  category: { id: 'c1', slug: 'ropa', name: 'Ropa' },
  volumeDiscounts: [],
  options: [],
  variants: [mockVariant],
  createdAt: new Date(),
  updatedAt: new Date(),
}

describe('getProducts', () => {
  it('returns mapped products with variants', async () => {
    ;(prisma.product.findMany as jest.Mock).mockResolvedValue([mockProduct])
    const products = await getProducts()
    expect(products).toHaveLength(1)
    expect(products[0].slug).toBe('camiseta-blanca')
    expect(products[0].variants).toHaveLength(1)
    expect(products[0].variants[0].price).toBe(25.0)
    expect(products[0].variants[0].stock).toBe(10)
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

  it('filters by price range using variants.some', async () => {
    ;(prisma.product.findMany as jest.Mock).mockResolvedValue([])
    await getProducts({ minPrice: 10, maxPrice: 50 })
    expect(prisma.product.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          variants: { some: { price: { gte: 10, lte: 50 } } },
        }),
      })
    )
  })

  it('filters by search term', async () => {
    ;(prisma.product.findMany as jest.Mock).mockResolvedValue([])
    await getProducts({ search: 'camiseta' })
    expect(prisma.product.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          OR: [
            { name: { contains: 'camiseta', mode: 'insensitive' } },
            { description: { contains: 'camiseta', mode: 'insensitive' } },
          ],
        }),
      })
    )
  })

  it('maps options and variants correctly', async () => {
    const productWithOptions = {
      ...mockProduct,
      options: [{
        id: 'opt1',
        name: 'Talle',
        position: 0,
        productId: 'p1',
        values: [
          { id: 'v1', value: 'S', position: 0, optionId: 'opt1' },
          { id: 'v2', value: 'M', position: 1, optionId: 'opt1' },
        ],
      }],
      variants: [
        { ...mockVariant, optionValues: [{ id: 'v1', value: 'S', position: 0 }] },
      ],
    }
    ;(prisma.product.findMany as jest.Mock).mockResolvedValue([productWithOptions])
    const products = await getProducts()
    expect(products[0].options).toHaveLength(1)
    expect(products[0].options[0].name).toBe('Talle')
    expect(products[0].options[0].values).toHaveLength(2)
    expect(products[0].variants[0].optionValues).toHaveLength(1)
    expect(products[0].variants[0].optionValues[0].value).toBe('S')
  })

  it('maps volume discounts correctly', async () => {
    const productWithDiscount = {
      ...mockProduct,
      volumeDiscounts: [
        { id: 'd1', minQty: 3, type: 'percent', value: { toNumber: () => 10 }, productId: 'p1' },
      ],
    }
    ;(prisma.product.findMany as jest.Mock).mockResolvedValue([productWithDiscount])
    const products = await getProducts()
    expect(products[0].volumeDiscounts).toHaveLength(1)
    expect(products[0].volumeDiscounts[0].value).toBe(10)
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
    expect(result?.variants).toHaveLength(1)
  })
})
```

- [ ] **Step 2: Run tests to confirm they fail**

```bash
npm test -- products.test
```

Expected: FAIL — `products[0].variants` is undefined.

- [ ] **Step 3: Replace `src/lib/data/products.ts`**

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
    categoryId: p.categoryId,
    category: p.category,
    volumeDiscounts: p.volumeDiscounts.map((d: any) => ({
      id: d.id,
      minQty: d.minQty,
      type: d.type as 'percent' | 'fixed',
      value: d.value.toNumber(),
      productId: d.productId,
    })),
    options: p.options.map((opt: any) => ({
      id: opt.id,
      name: opt.name,
      position: opt.position,
      values: opt.values.map((v: any) => ({
        id: v.id,
        value: v.value,
        position: v.position,
      })),
    })),
    variants: p.variants.map((v: any) => ({
      id: v.id,
      sku: v.sku,
      price: v.price.toNumber(),
      compareAtPrice: v.compareAtPrice ? v.compareAtPrice.toNumber() : null,
      stock: v.stock,
      optionValues: v.optionValues.map((ov: any) => ({
        id: ov.id,
        value: ov.value,
        position: ov.position,
      })),
    })),
  }
}

export async function getProducts(filters?: ProductFilters): Promise<Product[]> {
  const where: any = {}

  if (filters?.categorySlug) {
    where.category = { slug: filters.categorySlug }
  }
  if (filters?.minPrice !== undefined || filters?.maxPrice !== undefined) {
    const priceFilter: any = {}
    if (filters.minPrice !== undefined) priceFilter.gte = filters.minPrice
    if (filters.maxPrice !== undefined) priceFilter.lte = filters.maxPrice
    where.variants = { some: { price: priceFilter } }
  }
  if (filters?.search) {
    where.OR = [
      { name: { contains: filters.search, mode: 'insensitive' } },
      { description: { contains: filters.search, mode: 'insensitive' } },
    ]
  }

  const products = await prisma.product.findMany({
    where,
    include: {
      category: true,
      volumeDiscounts: true,
      options: {
        orderBy: { position: 'asc' },
        include: { values: { orderBy: { position: 'asc' } } },
      },
      variants: {
        include: { optionValues: true },
      },
    },
    orderBy: { createdAt: 'desc' },
  })

  return products.map(mapProduct)
}

export async function getProduct(slug: string): Promise<Product | null> {
  const product = await prisma.product.findUnique({
    where: { slug },
    include: {
      category: true,
      volumeDiscounts: true,
      options: {
        orderBy: { position: 'asc' },
        include: { values: { orderBy: { position: 'asc' } } },
      },
      variants: {
        include: { optionValues: true },
      },
    },
  })
  return product ? mapProduct(product) : null
}
```

- [ ] **Step 4: Run tests to confirm they pass**

```bash
npm test -- products.test
```

Expected: All tests PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/data/products.ts src/__tests__/lib/data/products.test.ts
git commit -m "feat: update data access layer for product variants"
```

---

## Task 5: Update cart store

**Files:**
- Modify: `src/lib/store/cart.ts`
- Modify: `src/__tests__/lib/store/cart.test.ts`

- [ ] **Step 1: Write the failing tests first**

Replace `src/__tests__/lib/store/cart.test.ts` with:

```typescript
import { renderHook, act } from '@testing-library/react'
import { useCartStore } from '@/lib/store/cart'
import type { Product, ProductVariant } from '@/lib/data/types'

const baseVariant: ProductVariant = {
  id: 'var1',
  sku: null,
  price: 100,
  compareAtPrice: null,
  stock: 20,
  optionValues: [],
}

const altVariant: ProductVariant = {
  id: 'var2',
  sku: null,
  price: 120,
  compareAtPrice: null,
  stock: 5,
  optionValues: [],
}

const baseProduct: Product = {
  id: 'p1',
  slug: 'test',
  name: 'Test Product',
  description: '',
  images: [],
  categoryId: 'c1',
  category: { id: 'c1', slug: 'cat', name: 'Cat' },
  volumeDiscounts: [],
  options: [],
  variants: [baseVariant],
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

  it('adds an item with variant', () => {
    const { result } = renderHook(() => useCartStore())
    act(() => result.current.addItem(baseProduct, baseVariant))
    expect(result.current.items).toHaveLength(1)
    expect(result.current.items[0].variant.id).toBe('var1')
    expect(result.current.items[0].quantity).toBe(1)
    expect(result.current.items[0].unitPrice).toBe(100)
    expect(result.current.items[0].basePrice).toBe(100)
    expect(result.current.items[0].variantLabel).toBe('Default')
  })

  it('increments quantity when adding same variant', () => {
    const { result } = renderHook(() => useCartStore())
    act(() => result.current.addItem(baseProduct, baseVariant))
    act(() => result.current.addItem(baseProduct, baseVariant))
    expect(result.current.items[0].quantity).toBe(2)
  })

  it('keeps separate cart items for different variants of same product', () => {
    const { result } = renderHook(() => useCartStore())
    act(() => result.current.addItem(baseProduct, baseVariant))
    act(() => result.current.addItem(baseProduct, altVariant))
    expect(result.current.items).toHaveLength(2)
  })

  it('removes an item by variantId', () => {
    const { result } = renderHook(() => useCartStore())
    act(() => result.current.addItem(baseProduct, baseVariant))
    act(() => result.current.removeItem('var1'))
    expect(result.current.items).toHaveLength(0)
  })

  it('applies volume discount when quantity threshold met', () => {
    const { result } = renderHook(() => useCartStore())
    act(() => result.current.addItem(productWithVolumeDiscount, baseVariant, 3))
    expect(result.current.items[0].unitPrice).toBe(90) // 100 * (1 - 0.10)
    expect(result.current.items[0].basePrice).toBe(100) // unchanged
  })

  it('does not apply volume discount below threshold', () => {
    const { result } = renderHook(() => useCartStore())
    act(() => result.current.addItem(productWithVolumeDiscount, baseVariant, 2))
    expect(result.current.items[0].unitPrice).toBe(100)
  })

  it('getSummary uses basePrice for subtotal (before volume discount)', () => {
    const { result } = renderHook(() => useCartStore())
    act(() => result.current.addItem(productWithVolumeDiscount, baseVariant, 3)) // unitPrice=90
    const { subtotal, volumeDiscount } = result.current.getSummary()
    expect(subtotal).toBe(300) // basePrice(100) * qty(3)
    expect(volumeDiscount).toBe(30) // 300 - 270
  })

  it('applies percent coupon to subtotal', () => {
    const { result } = renderHook(() => useCartStore())
    act(() => result.current.addItem(baseProduct, baseVariant, 2)) // subtotal = 200
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
    act(() => result.current.addItem(baseProduct, baseVariant, 1))
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
    act(() => result.current.addItem(baseProduct, baseVariant, 1)) // subtotal = 100
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
    act(() => result.current.addItem(baseProduct, baseVariant))
    act(() => result.current.clearCart())
    expect(result.current.items).toHaveLength(0)
  })
})
```

- [ ] **Step 2: Run tests to confirm they fail**

```bash
npm test -- cart.test
```

Expected: FAIL — `addItem` signature mismatch.

- [ ] **Step 3: Replace `src/lib/store/cart.ts`**

```typescript
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { CartItem, Coupon, Product, ProductVariant } from '@/lib/data/types'
import config from '../../../client.config'

function buildVariantLabel(product: Product, variant: ProductVariant): string {
  if (product.options.length === 0) return 'Default'
  return product.options
    .map((opt) => {
      const val = variant.optionValues.find((ov) =>
        opt.values.some((v) => v.id === ov.id)
      )
      return val ? `${opt.name}: ${val.value}` : opt.name
    })
    .join(' / ')
}

function applyVolumeDiscount(product: Product, variant: ProductVariant, quantity: number): number {
  if (!config.discounts.volumeDiscountsEnabled || !product.volumeDiscounts.length) return variant.price

  const applicable = product.volumeDiscounts
    .filter((d) => quantity >= d.minQty)
    .sort((a, b) => b.minQty - a.minQty)[0]

  if (!applicable) return variant.price

  if (applicable.type === 'percent') {
    return variant.price * (1 - applicable.value / 100)
  }
  return Math.max(0, variant.price - applicable.value)
}

interface CartSummary {
  subtotal: number
  volumeDiscount: number
  couponDiscount: number
  total: number
}

interface CartStore {
  items: CartItem[]
  coupon: Coupon | null
  couponError: string | null

  addItem: (product: Product, variant: ProductVariant, quantity?: number) => void
  removeItem: (variantId: string) => void
  updateQuantity: (variantId: string, quantity: number) => void
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

      addItem: (product, variant, quantity = 1) => {
        set((state) => {
          const existing = state.items.find((i) => i.variant.id === variant.id)
          if (existing) {
            const newQty = existing.quantity + quantity
            return {
              items: state.items.map((i) =>
                i.variant.id === variant.id
                  ? { ...i, quantity: newQty, unitPrice: applyVolumeDiscount(product, variant, newQty) }
                  : i
              ),
            }
          }
          return {
            items: [
              ...state.items,
              {
                product,
                variant,
                variantLabel: buildVariantLabel(product, variant),
                quantity,
                basePrice: variant.price,
                unitPrice: applyVolumeDiscount(product, variant, quantity),
              },
            ],
          }
        })
      },

      removeItem: (variantId) =>
        set((state) => ({ items: state.items.filter((i) => i.variant.id !== variantId) })),

      updateQuantity: (variantId, quantity) => {
        if (quantity <= 0) {
          get().removeItem(variantId)
          return
        }
        set((state) => ({
          items: state.items.map((i) =>
            i.variant.id === variantId
              ? { ...i, quantity, unitPrice: applyVolumeDiscount(i.product, i.variant, quantity) }
              : i
          ),
        }))
      },

      applyCoupon: (coupon) => {
        const { getSummary } = get()
        const { subtotal } = getSummary()
        if (coupon.minOrderAmount && subtotal < coupon.minOrderAmount) {
          set({ couponError: `mínimo de compra: $${coupon.minOrderAmount}`, coupon: null })
          return
        }
        set({ coupon, couponError: null })
      },

      removeCoupon: () => set({ coupon: null, couponError: null }),

      clearCart: () => set({ items: [], coupon: null, couponError: null }),

      getSummary: (): CartSummary => {
        const { items, coupon } = get()
        const subtotal = items.reduce((sum, i) => sum + i.unitPrice * i.quantity, 0)
        const baseSubtotal = items.reduce((sum, i) => sum + i.basePrice * i.quantity, 0)
        const volumeDiscount = baseSubtotal - subtotal

        let couponDiscount = 0
        if (coupon) {
          couponDiscount =
            coupon.type === 'percent'
              ? subtotal * (coupon.value / 100)
              : Math.min(coupon.value, subtotal)
        }
        return {
          subtotal: baseSubtotal,
          volumeDiscount,
          couponDiscount,
          total: Math.max(0, subtotal - couponDiscount),
        }
      },
    }),
    { name: 'cart-store' }
  )
)
```

- [ ] **Step 4: Run tests to confirm they pass**

```bash
npm test -- cart.test
```

Expected: All tests PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/store/cart.ts src/__tests__/lib/store/cart.test.ts
git commit -m "feat: update cart store API to variant-keyed items"
```

---

## Task 6: Update CartItem component

**Files:**
- Modify: `src/components/cart/CartItem.tsx`

- [ ] **Step 1: Replace `src/components/cart/CartItem.tsx`**

```typescript
'use client'

import Image from 'next/image'
import { Trash2 } from 'lucide-react'
import { useCartStore } from '@/lib/store/cart'
import type { CartItem as CartItemType } from '@/lib/data/types'

export function CartItem({ item }: { item: CartItemType }) {
  const { updateQuantity, removeItem } = useCartStore()
  const lineTotal = item.unitPrice * item.quantity
  const hasVolumeDiscount = item.unitPrice < item.basePrice

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
        {item.variantLabel !== 'Default' && (
          <p className="text-xs text-muted-foreground">{item.variantLabel}</p>
        )}
        <div className="text-sm text-muted-foreground">
          {hasVolumeDiscount ? (
            <span className="text-green-600">${item.unitPrice.toFixed(2)} c/u (desc. volumen)</span>
          ) : (
            <span>${item.unitPrice.toFixed(2)} c/u</span>
          )}
        </div>
        <div className="flex items-center gap-2 mt-1">
          <button
            onClick={() => updateQuantity(item.variant.id, item.quantity - 1)}
            className="h-6 w-6 rounded border border-input flex items-center justify-center text-sm hover:bg-muted"
          >
            -
          </button>
          <span className="text-sm w-6 text-center">{item.quantity}</span>
          <button
            onClick={() => updateQuantity(item.variant.id, item.quantity + 1)}
            className="h-6 w-6 rounded border border-input flex items-center justify-center text-sm hover:bg-muted disabled:opacity-50"
            disabled={item.quantity >= item.variant.stock}
          >
            +
          </button>
        </div>
      </div>
      <div className="flex flex-col items-end justify-between">
        <span className="font-semibold">${lineTotal.toFixed(2)}</span>
        <button
          onClick={() => removeItem(item.variant.id)}
          className="text-muted-foreground hover:text-destructive transition-colors"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Run TypeScript check on this file**

```bash
npx tsc --noEmit 2>&1 | grep CartItem
```

Expected: No errors for CartItem.tsx.

- [ ] **Step 3: Commit**

```bash
git add src/components/cart/CartItem.tsx
git commit -m "feat: update CartItem to use variant.id and basePrice"
```

---

## Task 7: Update ProductCard and AddToCartButton

**Files:**
- Modify: `src/components/product/ProductCard.tsx`
- Modify: `src/components/product/AddToCartButton.tsx`

- [ ] **Step 1: Replace `src/components/product/AddToCartButton.tsx`**

```typescript
'use client'

import { Button } from '@/components/ui/button'
import { useCartStore } from '@/lib/store/cart'
import type { Product, ProductVariant } from '@/lib/data/types'

interface AddToCartButtonProps {
  product: Product
  variant?: ProductVariant
  disabled?: boolean
}

export function AddToCartButton({ product, variant, disabled }: AddToCartButtonProps) {
  const addItem = useCartStore((s) => s.addItem)

  // For products with no options, use the Default variant automatically
  const effectiveVariant = variant ?? (product.options.length === 0 ? product.variants[0] : null)
  const isOutOfStock = effectiveVariant ? effectiveVariant.stock === 0 : false
  const isDisabled = disabled || !effectiveVariant || isOutOfStock

  const handleClick = () => {
    if (!effectiveVariant) return
    addItem(product, effectiveVariant)
  }

  return (
    <Button
      className="w-full"
      style={{ backgroundColor: 'var(--brand-primary)' }}
      onClick={handleClick}
      disabled={isDisabled}
    >
      {isOutOfStock ? 'Sin stock' : 'Agregar al carrito'}
    </Button>
  )
}
```

- [ ] **Step 2: Replace `src/components/product/ProductCard.tsx`**

```typescript
import Link from 'next/link'
import Image from 'next/image'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { AddToCartButton } from './AddToCartButton'
import type { Product } from '@/lib/data/types'

interface ProductCardProps {
  product: Product
}

export function ProductCard({ product }: ProductCardProps) {
  const prices = product.variants.map((v) => v.price)
  const minPrice = Math.min(...prices)
  const maxPrice = Math.max(...prices)
  const hasMultiplePrices = minPrice !== maxPrice

  // Use cheapest variant for discount badge
  const cheapestVariant = product.variants.find((v) => v.price === minPrice)
  const hasDiscount =
    !hasMultiplePrices &&
    cheapestVariant?.compareAtPrice &&
    cheapestVariant.compareAtPrice > minPrice
  const discountPct = hasDiscount
    ? Math.round((1 - minPrice / cheapestVariant!.compareAtPrice!) * 100)
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
          {hasMultiplePrices ? (
            <span className="text-lg font-bold">Desde ${minPrice.toFixed(2)}</span>
          ) : (
            <>
              <span className="text-lg font-bold">${minPrice.toFixed(2)}</span>
              {hasDiscount && (
                <span className="text-sm text-muted-foreground line-through">
                  ${cheapestVariant!.compareAtPrice!.toFixed(2)}
                </span>
              )}
            </>
          )}
        </div>
      </CardContent>
      <CardFooter className="p-4 pt-0">
        {product.options.length > 0 ? (
          <Link href={`/products/${product.slug}`} className="w-full">
            <Button variant="outline" className="w-full">
              Ver opciones
            </Button>
          </Link>
        ) : (
          <AddToCartButton product={product} />
        )}
      </CardFooter>
    </Card>
  )
}
```

- [ ] **Step 3: Run TypeScript check**

```bash
npx tsc --noEmit 2>&1 | grep -E "ProductCard|AddToCartButton"
```

Expected: No errors.

- [ ] **Step 4: Commit**

```bash
git add src/components/product/ProductCard.tsx src/components/product/AddToCartButton.tsx
git commit -m "feat: update ProductCard and AddToCartButton for variants"
```

---

## Task 8: Build VariantSelector component

**Files:**
- Create: `src/components/product/VariantSelector.tsx`
- Create: `src/__tests__/components/product/VariantSelector.test.tsx`

- [ ] **Step 1: Write the failing tests first**

Create `src/__tests__/components/product/VariantSelector.test.tsx`:

```typescript
import { render, screen, fireEvent } from '@testing-library/react'
import { VariantSelector } from '@/components/product/VariantSelector'
import type { ProductOption, ProductVariant } from '@/lib/data/types'

const sOptions: ProductOption[] = [
  {
    id: 'opt1',
    name: 'Talle',
    position: 0,
    values: [
      { id: 'v1', value: 'S', position: 0 },
      { id: 'v2', value: 'M', position: 1 },
      { id: 'v3', value: 'L', position: 2 },
    ],
  },
]

const sVariants: ProductVariant[] = [
  { id: 'var1', sku: null, price: 25, compareAtPrice: null, stock: 10, optionValues: [{ id: 'v1', value: 'S', position: 0 }] },
  { id: 'var2', sku: null, price: 25, compareAtPrice: null, stock: 0,  optionValues: [{ id: 'v2', value: 'M', position: 1 }] },
  { id: 'var3', sku: null, price: 30, compareAtPrice: null, stock: 5,  optionValues: [{ id: 'v3', value: 'L', position: 2 }] },
]

describe('VariantSelector', () => {
  it('renders option name and all values', () => {
    render(<VariantSelector options={sOptions} variants={sVariants} selectedVariant={null} onSelect={jest.fn()} />)
    expect(screen.getByText('Talle')).toBeInTheDocument()
    expect(screen.getByText('S')).toBeInTheDocument()
    expect(screen.getByText('M')).toBeInTheDocument()
    expect(screen.getByText('L')).toBeInTheDocument()
  })

  it('calls onSelect with matching variant when value clicked', () => {
    const onSelect = jest.fn()
    render(<VariantSelector options={sOptions} variants={sVariants} selectedVariant={null} onSelect={onSelect} />)
    fireEvent.click(screen.getByText('S'))
    expect(onSelect).toHaveBeenCalledWith(sVariants[0])
  })

  it('marks out-of-stock value as disabled', () => {
    render(<VariantSelector options={sOptions} variants={sVariants} selectedVariant={null} onSelect={jest.fn()} />)
    const mBtn = screen.getByText('M').closest('button')
    expect(mBtn).toBeDisabled()
  })

  it('does not call onSelect when clicking disabled button', () => {
    const onSelect = jest.fn()
    render(<VariantSelector options={sOptions} variants={sVariants} selectedVariant={null} onSelect={onSelect} />)
    fireEvent.click(screen.getByText('M'))
    expect(onSelect).not.toHaveBeenCalled()
  })

  it('renders hex color values as circle buttons without text', () => {
    const colorOptions: ProductOption[] = [{
      id: 'opt2',
      name: 'Color',
      position: 0,
      values: [
        { id: 'c1', value: '#000000', position: 0 },
        { id: 'c2', value: '#ffffff', position: 1 },
      ],
    }]
    const colorVariants: ProductVariant[] = [
      { id: 'var4', sku: null, price: 25, compareAtPrice: null, stock: 5, optionValues: [{ id: 'c1', value: '#000000', position: 0 }] },
      { id: 'var5', sku: null, price: 25, compareAtPrice: null, stock: 3, optionValues: [{ id: 'c2', value: '#ffffff', position: 1 }] },
    ]
    const { container } = render(
      <VariantSelector options={colorOptions} variants={colorVariants} selectedVariant={null} onSelect={jest.fn()} />
    )
    // Hex values should NOT appear as text
    expect(screen.queryByText('#000000')).not.toBeInTheDocument()
    // Should have color circle buttons with inline style backgroundColor
    const colorBtns = container.querySelectorAll('[data-color-swatch]')
    expect(colorBtns.length).toBe(2)
  })

  it('shows selected value name next to option label', () => {
    render(
      <VariantSelector
        options={sOptions}
        variants={sVariants}
        selectedVariant={sVariants[0]}
        onSelect={jest.fn()}
      />
    )
    expect(screen.getByText(': S')).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run tests to confirm they fail**

```bash
npm test -- VariantSelector.test
```

Expected: FAIL — `VariantSelector` not found.

- [ ] **Step 3: Create `src/components/product/VariantSelector.tsx`**

```typescript
'use client'

import { useState, useEffect } from 'react'
import type { ProductOption, ProductVariant } from '@/lib/data/types'

const HEX_REGEX = /^#[0-9a-f]{3,6}$/i

function isHexColor(value: string): boolean {
  return HEX_REGEX.test(value)
}

interface VariantSelectorProps {
  options: ProductOption[]
  variants: ProductVariant[]
  selectedVariant: ProductVariant | null
  onSelect: (variant: ProductVariant | null) => void
}

export function VariantSelector({ options, variants, selectedVariant, onSelect }: VariantSelectorProps) {
  const [selectedValues, setSelectedValues] = useState<Record<string, string>>({})

  useEffect(() => {
    if (Object.keys(selectedValues).length === 0) {
      onSelect(null)
      return
    }
    // All axes must be selected to resolve a variant
    const allSelected = options.every((opt) => selectedValues[opt.id])
    if (!allSelected) {
      onSelect(null)
      return
    }
    const match = variants.find((v) =>
      options.every((opt) => {
        const selectedValueId = selectedValues[opt.id]
        return v.optionValues.some((ov) => ov.id === selectedValueId)
      })
    )
    onSelect(match ?? null)
  }, [selectedValues]) // eslint-disable-line react-hooks/exhaustive-deps

  function selectValue(optionId: string, valueId: string) {
    setSelectedValues((prev) => ({ ...prev, [optionId]: valueId }))
  }

  // A value is available if there is at least one in-stock variant that:
  // 1. Has this optionValue
  // 2. Matches all OTHER currently-selected axes
  function isValueAvailable(optionId: string, valueId: string): boolean {
    return variants.some((v) => {
      if (!v.optionValues.some((ov) => ov.id === valueId)) return false
      for (const [otherOptId, otherValId] of Object.entries(selectedValues)) {
        if (otherOptId === optionId) continue
        if (!v.optionValues.some((ov) => ov.id === otherValId)) return false
      }
      return v.stock > 0
    })
  }

  return (
    <div className="space-y-4">
      {options.map((option) => {
        const selectedValueId = selectedValues[option.id]
        const selectedValue = option.values.find((v) => v.id === selectedValueId)

        return (
          <div key={option.id}>
            <p className="text-sm font-semibold mb-2">
              {option.name}
              {selectedValue && (
                <span className="font-normal text-muted-foreground">: {selectedValue.value}</span>
              )}
            </p>
            <div className="flex flex-wrap gap-2">
              {option.values.map((optValue) => {
                const isSelected = selectedValueId === optValue.id
                const available = isValueAvailable(option.id, optValue.id)

                if (isHexColor(optValue.value)) {
                  return (
                    <button
                      key={optValue.id}
                      data-color-swatch
                      onClick={() => available && selectValue(option.id, optValue.id)}
                      title={optValue.value}
                      aria-label={`Color ${optValue.value}${!available ? ' (sin stock)' : ''}`}
                      style={{
                        width: 28,
                        height: 28,
                        borderRadius: '50%',
                        backgroundColor: optValue.value,
                        border: '1px solid #ddd',
                        boxShadow: isSelected
                          ? `0 0 0 2px white, 0 0 0 4px ${optValue.value}`
                          : undefined,
                        opacity: available ? 1 : 0.35,
                        cursor: available ? 'pointer' : 'not-allowed',
                        flexShrink: 0,
                      }}
                    />
                  )
                }

                return (
                  <button
                    key={optValue.id}
                    onClick={() => selectValue(option.id, optValue.id)}
                    disabled={!available}
                    className={[
                      'px-3 py-1.5 text-sm rounded-md border transition-all',
                      isSelected
                        ? 'border-2 border-foreground font-semibold'
                        : 'border-border hover:border-foreground',
                      !available ? 'opacity-40 line-through cursor-not-allowed' : 'cursor-pointer',
                    ].join(' ')}
                  >
                    {optValue.value}
                  </button>
                )
              })}
            </div>
          </div>
        )
      })}
    </div>
  )
}
```

- [ ] **Step 4: Run tests to confirm they pass**

```bash
npm test -- VariantSelector.test
```

Expected: All tests PASS.

- [ ] **Step 5: Commit**

```bash
git add src/components/product/VariantSelector.tsx src/__tests__/components/product/VariantSelector.test.tsx
git commit -m "feat: add generic VariantSelector component"
```

---

## Task 9: Update product detail page + WhatsApp adapter

**Files:**
- Create: `src/components/product/ProductInfo.tsx`
- Modify: `src/app/(shop)/products/[slug]/page.tsx`
- Modify: `src/lib/checkout/whatsapp.ts`

- [ ] **Step 1: Create `src/components/product/ProductInfo.tsx`**

This Client Component owns variant selection state and renders the interactive parts of the product detail.

```typescript
'use client'

import { useState } from 'react'
import type { Product, ProductVariant } from '@/lib/data/types'
import { VariantSelector } from './VariantSelector'
import { AddToCartButton } from './AddToCartButton'
import { Separator } from '@/components/ui/separator'

interface ProductInfoProps {
  product: Product
}

export function ProductInfo({ product }: ProductInfoProps) {
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(
    // Auto-select the Default variant for products with no option axes
    product.options.length === 0 ? product.variants[0] : null
  )

  const minPrice = Math.min(...product.variants.map((v) => v.price))
  const displayPrice = selectedVariant?.price ?? minPrice
  const displayCompareAt = selectedVariant?.compareAtPrice ?? null
  const hasDiscount = displayCompareAt !== null && displayCompareAt > displayPrice
  const discountPct = hasDiscount
    ? Math.round((1 - displayPrice / displayCompareAt!) * 100)
    : 0

  return (
    <>
      <div className="flex items-center gap-3">
        <span className="text-3xl font-bold">${displayPrice.toFixed(2)}</span>
        {hasDiscount && (
          <>
            <span className="text-lg text-muted-foreground line-through">
              ${displayCompareAt!.toFixed(2)}
            </span>
            <span className="text-sm bg-red-100 text-red-700 px-2 py-0.5 rounded">
              -{discountPct}%
            </span>
          </>
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

      {product.options.length > 0 && (
        <VariantSelector
          options={product.options}
          variants={product.variants}
          selectedVariant={selectedVariant}
          onSelect={setSelectedVariant}
        />
      )}

      <p className="text-sm text-muted-foreground">
        Stock disponible:{' '}
        <span className="font-medium text-foreground">
          {selectedVariant ? selectedVariant.stock : '—'}
        </span>
      </p>

      <AddToCartButton
        product={product}
        variant={selectedVariant ?? undefined}
        disabled={product.options.length > 0 && selectedVariant === null}
      />
    </>
  )
}
```

- [ ] **Step 2: Replace `src/app/(shop)/products/[slug]/page.tsx`**

```typescript
import { notFound } from 'next/navigation'
import Image from 'next/image'
import { getProduct } from '@/lib/data/products'
import { ProductInfo } from '@/components/product/ProductInfo'

interface PageProps {
  params: Promise<{ slug: string }>
}

export default async function ProductPage({ params }: PageProps) {
  const { slug } = await params
  const product = await getProduct(slug)

  if (!product) notFound()

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
        {/* Image */}
        <div className="relative aspect-square overflow-hidden rounded-lg bg-muted">
          <Image
            src={product.images[0] ?? '/placeholder.png'}
            alt={product.name}
            fill
            className="object-cover"
            priority
          />
        </div>

        {/* Info */}
        <div className="flex flex-col gap-4">
          <div>
            <p className="text-sm text-muted-foreground">{product.category.name}</p>
            <h1 className="text-3xl font-bold mt-1">{product.name}</h1>
          </div>

          <p className="text-muted-foreground leading-relaxed">{product.description}</p>

          <ProductInfo product={product} />
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Update `src/lib/checkout/whatsapp.ts` to include variantLabel**

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
      .map((i) => {
        const variantPart = i.variantLabel !== 'Default' ? ` (${i.variantLabel})` : ''
        return `• ${i.product.name}${variantPart} x${i.quantity} — $${(i.unitPrice * i.quantity).toFixed(2)}`
      })
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

  async handleCheckout(items: CartItem[], total: number, _customer?: Customer): Promise<void> {
    window.open(this.buildUrl(items, total), '_blank')
  }
}
```

- [ ] **Step 4: Run TypeScript check across the whole project**

```bash
npx tsc --noEmit
```

Expected: Zero errors. If there are errors in components we haven't touched yet (like checkout page), fix them now: any reference to `item.product.price` should become `item.basePrice`, any reference to `item.product.stock` should become `item.variant.stock`, any reference to `removeItem(item.product.id)` should become `removeItem(item.variant.id)`.

- [ ] **Step 5: Run all tests**

```bash
npm test
```

Expected: All tests PASS.

- [ ] **Step 6: Commit**

```bash
git add src/components/product/ProductInfo.tsx src/app/(shop)/products/[slug]/page.tsx src/lib/checkout/whatsapp.ts
git commit -m "feat: add ProductInfo client component and update product detail page"
```

---

## Task 10: Build business types system

**Files:**
- Create: `business-types/base.ts`
- Create: `business-types/clothing.ts`
- Create: `business-types/footwear.ts`
- Create: `business-types/electronics.ts`
- Create: `business-types/food.ts`
- Create: `business-types/index.ts`

- [ ] **Step 1: Create `business-types/base.ts`**

```typescript
export interface VariantAxis {
  name: string      // "Talle", "Sabor", "Almacenamiento"
  values: string[]  // ["S","M","L"] or ["#000000","#ffffff"]
}

export interface SampleProductVariant {
  options: Record<string, string>  // { Talle: "M", Color: "#000000" }
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
  images: string[]
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

- [ ] **Step 2: Create `business-types/clothing.ts`**

```typescript
import type { BusinessType } from './base'

export const clothing: BusinessType = {
  id: 'clothing',
  name: 'Ropa',
  description: 'Tienda de indumentaria con variantes de talle y color',
  variantAxes: [
    { name: 'Talle', values: ['XS', 'S', 'M', 'L', 'XL', 'XXL'] },
    { name: 'Color', values: ['#000000', '#ffffff', '#1d4ed8', '#dc2626'] },
  ],
  defaultCategories: [
    { name: 'Hombre', slug: 'hombre' },
    { name: 'Mujer', slug: 'mujer' },
    { name: 'Niños', slug: 'ninos' },
    { name: 'Accesorios', slug: 'accesorios' },
  ],
  sampleProducts: [
    {
      name: 'Remera Básica',
      slug: 'remera-basica',
      description: 'Remera de algodón 100%, corte clásico. Ideal para el día a día.',
      categorySlug: 'hombre',
      images: ['https://placehold.co/600x600?text=Remera'],
      variants: [
        { options: { Talle: 'S', Color: '#000000' }, price: 25.00, stock: 10 },
        { options: { Talle: 'M', Color: '#000000' }, price: 25.00, stock: 15 },
        { options: { Talle: 'L', Color: '#000000' }, price: 25.00, stock: 8 },
        { options: { Talle: 'XL', Color: '#000000' }, price: 25.00, stock: 0 },
        { options: { Talle: 'S', Color: '#ffffff' }, price: 25.00, stock: 12 },
        { options: { Talle: 'M', Color: '#ffffff' }, price: 25.00, stock: 10 },
        { options: { Talle: 'L', Color: '#ffffff' }, price: 25.00, stock: 5 },
        { options: { Talle: 'XL', Color: '#ffffff' }, price: 25.00, stock: 3 },
      ],
    },
    {
      name: 'Jeans Slim Fit',
      slug: 'jeans-slim-fit',
      description: 'Jeans de mezclilla premium, corte slim. Lavado oscuro.',
      categorySlug: 'hombre',
      images: ['https://placehold.co/600x600?text=Jeans'],
      variants: [
        { options: { Talle: 'S', Color: '#1d4ed8' }, price: 60.00, stock: 8 },
        { options: { Talle: 'M', Color: '#1d4ed8' }, price: 60.00, stock: 12 },
        { options: { Talle: 'L', Color: '#1d4ed8' }, price: 60.00, stock: 6 },
        { options: { Talle: 'S', Color: '#000000' }, price: 60.00, stock: 10 },
        { options: { Talle: 'M', Color: '#000000' }, price: 60.00, stock: 14 },
        { options: { Talle: 'L', Color: '#000000' }, price: 60.00, stock: 4 },
      ],
    },
    {
      name: 'Mochila Urbana',
      slug: 'mochila-urbana',
      description: 'Mochila resistente al agua con compartimento para laptop de 15".',
      categorySlug: 'accesorios',
      images: ['https://placehold.co/600x600?text=Mochila'],
      // Empty options object → Default variant
      variants: [
        { options: {}, price: 45.00, compareAtPrice: 55.00, stock: 20 },
      ],
    },
  ],
  suggestedConfig: {
    tagline: 'Moda para cada ocasión',
    theme: { primary: '#111111' },
    checkout: { mode: 'whatsapp' },
  },
}
```

- [ ] **Step 3: Create `business-types/footwear.ts`**

```typescript
import type { BusinessType } from './base'

export const footwear: BusinessType = {
  id: 'footwear',
  name: 'Zapatería',
  description: 'Tienda de calzado con variantes de talle y color',
  variantAxes: [
    { name: 'Talle', values: ['35', '36', '37', '38', '39', '40', '41', '42', '43', '44', '45', '46'] },
    { name: 'Color', values: ['#000000', '#ffffff', '#8B4513', '#dc2626'] },
  ],
  defaultCategories: [
    { name: 'Deportivo', slug: 'deportivo' },
    { name: 'Casual', slug: 'casual' },
    { name: 'Niños', slug: 'ninos' },
  ],
  sampleProducts: [
    {
      name: 'Zapatilla Running Pro',
      slug: 'zapatilla-running-pro',
      description: 'Zapatilla de running con suela amortiguada y upper transpirable.',
      categorySlug: 'deportivo',
      images: ['https://placehold.co/600x600?text=Zapatilla'],
      variants: [
        { options: { Talle: '38', Color: '#000000' }, price: 85.00, stock: 5 },
        { options: { Talle: '39', Color: '#000000' }, price: 85.00, stock: 8 },
        { options: { Talle: '40', Color: '#000000' }, price: 85.00, stock: 10 },
        { options: { Talle: '41', Color: '#000000' }, price: 85.00, stock: 6 },
        { options: { Talle: '42', Color: '#000000' }, price: 85.00, stock: 4 },
        { options: { Talle: '38', Color: '#ffffff' }, price: 85.00, stock: 3 },
        { options: { Talle: '39', Color: '#ffffff' }, price: 85.00, stock: 7 },
        { options: { Talle: '40', Color: '#ffffff' }, price: 85.00, stock: 9 },
      ],
    },
    {
      name: 'Mocasín Cuero',
      slug: 'mocasin-cuero',
      description: 'Mocasín de cuero genuino, ideal para ocasiones formales.',
      categorySlug: 'casual',
      images: ['https://placehold.co/600x600?text=Mocasin'],
      variants: [
        { options: { Talle: '39', Color: '#8B4513' }, price: 120.00, stock: 4 },
        { options: { Talle: '40', Color: '#8B4513' }, price: 120.00, stock: 6 },
        { options: { Talle: '41', Color: '#8B4513' }, price: 120.00, stock: 5 },
        { options: { Talle: '42', Color: '#8B4513' }, price: 120.00, stock: 3 },
        { options: { Talle: '39', Color: '#000000' }, price: 120.00, stock: 8 },
        { options: { Talle: '40', Color: '#000000' }, price: 120.00, stock: 10 },
      ],
    },
    {
      name: 'Bota de Lluvia',
      slug: 'bota-lluvia',
      description: 'Bota impermeable de goma, perfecta para días lluviosos.',
      categorySlug: 'casual',
      images: ['https://placehold.co/600x600?text=Bota'],
      variants: [
        { options: { Talle: '37', Color: '#000000' }, price: 55.00, stock: 5 },
        { options: { Talle: '38', Color: '#000000' }, price: 55.00, stock: 8 },
        { options: { Talle: '39', Color: '#000000' }, price: 55.00, stock: 10 },
        { options: { Talle: '37', Color: '#dc2626' }, price: 55.00, stock: 3 },
        { options: { Talle: '38', Color: '#dc2626' }, price: 55.00, stock: 6 },
      ],
    },
  ],
  suggestedConfig: {
    tagline: 'El calzado que te lleva lejos',
    theme: { primary: '#8B4513' },
    checkout: { mode: 'whatsapp' },
  },
}
```

- [ ] **Step 4: Create `business-types/electronics.ts`**

```typescript
import type { BusinessType } from './base'

export const electronics: BusinessType = {
  id: 'electronics',
  name: 'Electrónica',
  description: 'Tienda de electrónica con variantes de color y garantía',
  variantAxes: [
    { name: 'Color', values: ['Negro', 'Blanco', 'Azul'] },
    { name: 'Garantía', values: ['1 año', '2 años'] },
  ],
  defaultCategories: [
    { name: 'Audio', slug: 'audio' },
    { name: 'Móviles', slug: 'moviles' },
    { name: 'Computación', slug: 'computacion' },
  ],
  sampleProducts: [
    {
      name: 'Auriculares BT Pro',
      slug: 'auriculares-bt-pro',
      description: 'Auriculares inalámbricos con cancelación de ruido y 30h de batería.',
      categorySlug: 'audio',
      images: ['https://placehold.co/600x600?text=Auriculares'],
      variants: [
        { options: { Color: 'Negro', Garantía: '1 año' }, price: 89.00, compareAtPrice: 120.00, stock: 10 },
        { options: { Color: 'Negro', Garantía: '2 años' }, price: 104.00, compareAtPrice: 120.00, stock: 8 },
        { options: { Color: 'Blanco', Garantía: '1 año' }, price: 89.00, compareAtPrice: 120.00, stock: 6 },
        { options: { Color: 'Blanco', Garantía: '2 años' }, price: 104.00, compareAtPrice: 120.00, stock: 4 },
        { options: { Color: 'Azul', Garantía: '1 año' }, price: 89.00, compareAtPrice: 120.00, stock: 0 },
      ],
    },
    {
      name: 'Parlante Portátil',
      slug: 'parlante-portatil',
      description: 'Parlante Bluetooth resistente al agua, 10h de reproducción.',
      categorySlug: 'audio',
      images: ['https://placehold.co/600x600?text=Parlante'],
      variants: [
        { options: { Color: 'Negro', Garantía: '1 año' }, price: 45.00, stock: 15 },
        { options: { Color: 'Negro', Garantía: '2 años' }, price: 60.00, stock: 8 },
        { options: { Color: 'Azul', Garantía: '1 año' }, price: 45.00, stock: 12 },
        { options: { Color: 'Azul', Garantía: '2 años' }, price: 60.00, stock: 5 },
      ],
    },
    {
      name: 'Teclado Mecánico',
      slug: 'teclado-mecanico',
      description: 'Teclado mecánico compacto, switches Cherry MX Blue.',
      categorySlug: 'computacion',
      images: ['https://placehold.co/600x600?text=Teclado'],
      variants: [
        { options: { Color: 'Negro', Garantía: '1 año' }, price: 75.00, stock: 8 },
        { options: { Color: 'Blanco', Garantía: '1 año' }, price: 75.00, stock: 5 },
        { options: { Color: 'Negro', Garantía: '2 años' }, price: 90.00, stock: 4 },
      ],
    },
  ],
  suggestedConfig: {
    tagline: 'Tecnología que transforma tu día',
    theme: { primary: '#2563eb' },
    checkout: { mode: 'whatsapp' },
  },
}
```

- [ ] **Step 5: Create `business-types/food.ts`**

```typescript
import type { BusinessType } from './base'

export const food: BusinessType = {
  id: 'food',
  name: 'Comida / Nutrición',
  description: 'Tienda de alimentos y suplementos con variantes de sabor y tamaño',
  variantAxes: [
    { name: 'Sabor', values: ['Vainilla', 'Chocolate', 'Frutilla', 'Cookies'] },
    { name: 'Tamaño', values: ['500 g', '1 kg', '3 kg'] },
  ],
  defaultCategories: [
    { name: 'Proteínas', slug: 'proteinas' },
    { name: 'Snacks', slug: 'snacks' },
    { name: 'Bebidas', slug: 'bebidas' },
  ],
  sampleProducts: [
    {
      name: 'Proteína Whey Gold',
      slug: 'proteina-whey-gold',
      description: 'Proteína de suero de leche de alta pureza, 25g de proteína por porción.',
      categorySlug: 'proteinas',
      images: ['https://placehold.co/600x600?text=Whey'],
      variants: [
        { options: { Sabor: 'Chocolate', Tamaño: '500 g' }, price: 20.00, stock: 15 },
        { options: { Sabor: 'Chocolate', Tamaño: '1 kg' }, price: 35.00, stock: 10 },
        { options: { Sabor: 'Chocolate', Tamaño: '3 kg' }, price: 90.00, stock: 5 },
        { options: { Sabor: 'Vainilla', Tamaño: '500 g' }, price: 20.00, stock: 12 },
        { options: { Sabor: 'Vainilla', Tamaño: '1 kg' }, price: 35.00, stock: 8 },
        { options: { Sabor: 'Frutilla', Tamaño: '500 g' }, price: 20.00, stock: 10 },
        { options: { Sabor: 'Frutilla', Tamaño: '1 kg' }, price: 35.00, stock: 6 },
        { options: { Sabor: 'Cookies', Tamaño: '500 g' }, price: 20.00, stock: 0 },
        { options: { Sabor: 'Cookies', Tamaño: '1 kg' }, price: 35.00, stock: 0 },
      ],
    },
    {
      name: 'Barra de Proteína',
      slug: 'barra-de-proteina',
      description: 'Barra proteica sin azúcar, 20g de proteína por unidad.',
      categorySlug: 'snacks',
      images: ['https://placehold.co/600x600?text=Barra'],
      variants: [
        { options: { Sabor: 'Chocolate', Tamaño: '500 g' }, price: 15.00, stock: 20 },
        { options: { Sabor: 'Vainilla', Tamaño: '500 g' }, price: 15.00, stock: 18 },
        { options: { Sabor: 'Frutilla', Tamaño: '500 g' }, price: 15.00, stock: 10 },
      ],
    },
    {
      name: 'Pre-Workout Energy',
      slug: 'pre-workout-energy',
      description: 'Suplemento pre-entrenamiento con cafeína y beta-alanina.',
      categorySlug: 'bebidas',
      images: ['https://placehold.co/600x600?text=PreWorkout'],
      variants: [
        { options: { Sabor: 'Frutilla', Tamaño: '500 g' }, price: 28.00, stock: 8 },
        { options: { Sabor: 'Vainilla', Tamaño: '500 g' }, price: 28.00, stock: 6 },
      ],
    },
  ],
  suggestedConfig: {
    tagline: 'Nutrición de calidad para tu rendimiento',
    theme: { primary: '#16a34a' },
    checkout: { mode: 'whatsapp' },
  },
}
```

- [ ] **Step 6: Create `business-types/index.ts`**

```typescript
import { clothing } from './clothing'
import { footwear } from './footwear'
import { electronics } from './electronics'
import { food } from './food'
import type { BusinessType } from './base'

export const businessTypes: BusinessType[] = [clothing, footwear, electronics, food]

export function getBusinessType(id: string): BusinessType | undefined {
  return businessTypes.find((bt) => bt.id === id)
}

export { clothing, footwear, electronics, food }
export type { BusinessType, VariantAxis, SampleProduct, SampleProductVariant } from './base'
```

- [ ] **Step 7: Check TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: No errors for business-types files.

- [ ] **Step 8: Commit**

```bash
git add business-types/
git commit -m "feat: add BusinessType profiles (clothing, footwear, electronics, food)"
```

---

## Task 11: Build setup wizard

**Files:**
- Create: `scripts/setup.ts`
- Modify: `package.json`

- [ ] **Step 1: Create `scripts/setup.ts`**

```typescript
import { select, input, confirm } from '@inquirer/prompts'
import { businessTypes } from '../business-types'
import type { BusinessType, VariantAxis } from '../business-types'
import * as fs from 'fs'
import * as path from 'path'
import { execSync } from 'child_process'

interface WizardAnswers {
  storeName: string
  tagline: string
  brandColor: string
  whatsapp: string
  checkoutMode: 'whatsapp' | 'qr' | 'payment'
}

function generateClientConfig(answers: WizardAnswers): string {
  return `export interface ClientConfig {
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
  name: ${JSON.stringify(answers.storeName)},
  tagline: ${JSON.stringify(answers.tagline)},
  logo: '/client/logo.png',
  favicon: '/client/favicon.ico',

  theme: {
    primary: ${JSON.stringify(answers.brandColor)},
    background: '#ffffff',
    foreground: '#0a0a0a',
    // Note: font must also be updated in src/app/layout.tsx
    font: 'Inter',
  },

  whatsapp: {
    number: ${JSON.stringify(answers.whatsapp)},
    messageTemplate: 'Hola! Quiero pedir:\\n{items}\\nTotal: \${'{total}'}',
  },

  checkout: {
    mode: ${JSON.stringify(answers.checkoutMode)},
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
`
}

function generateSeed(businessTypeId: string): string {
  return `import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import bcrypt from 'bcryptjs'
import 'dotenv/config'
import { ${businessTypeId} } from '../business-types'

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! })
const prisma = new PrismaClient({ adapter })

type BT = typeof ${businessTypeId}

async function seedFromBusinessType(bt: BT) {
  const categoryMap: Record<string, { id: string }> = {}
  for (const cat of bt.defaultCategories) {
    const created = await prisma.category.upsert({
      where: { slug: cat.slug },
      update: {},
      create: { slug: cat.slug, name: cat.name },
    })
    categoryMap[cat.slug] = created
  }

  for (const sp of bt.sampleProducts) {
    const category = categoryMap[sp.categorySlug]
    if (!category) continue
    const hasOptions = sp.variants.length > 0 && Object.keys(sp.variants[0].options).length > 0
    const optionAxes = bt.variantAxes.filter((axis) =>
      sp.variants.some((v) => axis.name in v.options)
    )

    const existing = await prisma.product.findUnique({ where: { slug: sp.slug } })
    if (existing) await prisma.product.delete({ where: { slug: sp.slug } })

    await prisma.product.create({
      data: {
        slug: sp.slug,
        name: sp.name,
        description: sp.description,
        images: sp.images,
        categoryId: category.id,
        options: hasOptions
          ? {
              create: optionAxes.map((axis, axisIdx) => ({
                name: axis.name,
                position: axisIdx,
                values: { create: axis.values.map((val, valIdx) => ({ value: val, position: valIdx })) },
              })),
            }
          : undefined,
      },
    })

    const product = await prisma.product.findUnique({
      where: { slug: sp.slug },
      include: { options: { include: { values: true } } },
    })
    if (!product) continue

    for (const sv of sp.variants) {
      const optionValueIds: string[] = []
      for (const [axisName, axisValue] of Object.entries(sv.options)) {
        const option = product.options.find((o) => o.name === axisName)
        const optionValue = option?.values.find((v) => v.value === axisValue)
        if (optionValue) optionValueIds.push(optionValue.id)
      }
      await prisma.productVariant.create({
        data: {
          productId: product.id,
          price: sv.price,
          compareAtPrice: sv.compareAtPrice ?? null,
          stock: sv.stock,
          sku: sv.sku ?? null,
          optionValues: optionValueIds.length > 0 ? { connect: optionValueIds.map((id) => ({ id })) } : undefined,
        },
      })
    }
  }
}

async function main() {
  await seedFromBusinessType(${businessTypeId})

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

  const hash = await bcrypt.hash('password123', 10)
  await prisma.user.upsert({
    where: { email: 'demo@example.com' },
    update: {},
    create: { email: 'demo@example.com', name: 'Usuario Demo', password: hash },
  })

  console.log('✅ Seed completado')
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
`
}

async function main() {
  console.log('\n🛒 E-commerce Template — Setup Wizard\n')

  // 1. Select business type
  const businessTypeId = await select({
    message: 'Tipo de negocio:',
    choices: [
      ...businessTypes.map((bt) => ({ name: `${bt.name} — ${bt.description}`, value: bt.id })),
      { name: 'Otro (personalizado)', value: 'custom' },
    ],
  })

  let selectedType: BusinessType | undefined = businessTypes.find((bt) => bt.id === businessTypeId)
  let customAxes: VariantAxis[] = []
  let effectiveTypeId = businessTypeId

  if (businessTypeId === 'custom') {
    effectiveTypeId = 'clothing' // fallback for seed generation; user will customize
    let addingAxes = true
    while (addingAxes) {
      const axisName = await input({ message: 'Nombre del eje de variante (ej: Talle):' })
      const axisValues = await input({ message: 'Valores separados por coma (ej: S,M,L,XL):' })
      customAxes.push({
        name: axisName.trim(),
        values: axisValues.split(',').map((v) => v.trim()).filter(Boolean),
      })
      addingAxes = await confirm({ message: '¿Agregar otro eje de variante?', default: false })
    }
  }

  // 2. Store details
  const storeName = await input({
    message: 'Nombre de la tienda:',
    default: selectedType?.name ?? 'Mi Tienda',
  })

  const tagline = await input({
    message: 'Tagline:',
    default: selectedType?.suggestedConfig.tagline ?? 'Bienvenido a nuestra tienda',
  })

  const brandColor = await input({
    message: 'Color principal (hex, ej: #2563eb):',
    default: selectedType?.suggestedConfig.theme?.primary ?? '#111111',
    validate: (val: string) =>
      /^#[0-9a-f]{3,6}$/i.test(val) ? true : 'Ingresá un color hex válido (ej: #ff0000)',
  })

  const whatsapp = await input({
    message: 'Número de WhatsApp (con código de país, ej: +5491112345678):',
    default: '+5491112345678',
  })

  const checkoutMode = await select<'whatsapp' | 'qr' | 'payment'>({
    message: 'Modo de checkout:',
    choices: [
      { name: 'WhatsApp', value: 'whatsapp' },
      { name: 'Código QR', value: 'qr' },
      { name: 'Pago en línea', value: 'payment' },
    ],
    default: selectedType?.suggestedConfig.checkout?.mode ?? 'whatsapp',
  })

  // 3. Write client.config.ts
  const configContent = generateClientConfig({ storeName, tagline, brandColor, whatsapp, checkoutMode })
  fs.writeFileSync(path.join(process.cwd(), 'client.config.ts'), configContent, 'utf-8')
  console.log('\n✅ client.config.ts generado')

  // 4. Write prisma/seed.ts
  const seedContent = generateSeed(effectiveTypeId)
  fs.writeFileSync(path.join(process.cwd(), 'prisma', 'seed.ts'), seedContent, 'utf-8')
  const catCount = selectedType?.defaultCategories.length ?? customAxes.length
  const prodCount = selectedType?.sampleProducts.length ?? 0
  console.log(`✅ seed data generado (${catCount} categorías, ${prodCount} productos con variantes)`)

  // 5. Run migrations?
  const runMigrations = await confirm({
    message: '¿Correr migraciones y seed ahora?',
    default: true,
  })

  if (runMigrations) {
    console.log('\nEjecutando migraciones...')
    execSync('npx prisma migrate dev --name setup', { stdio: 'inherit' })
    console.log('Ejecutando seed...')
    execSync('npx prisma db seed', { stdio: 'inherit' })
    console.log('\n✅ Base de datos lista')
  }

  console.log('\n🎉 ¡Setup completado! Ejecutá npm run dev para iniciar.\n')
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
```

- [ ] **Step 2: Add `setup` script to `package.json`**

In `package.json`, in the `"scripts"` section, add:

```json
"setup": "npx tsx scripts/setup.ts"
```

The scripts section should look like:

```json
"scripts": {
  "dev": "next dev",
  "build": "next build",
  "start": "next start",
  "lint": "eslint",
  "test": "jest",
  "test:watch": "jest --watch",
  "setup": "npx tsx scripts/setup.ts"
},
```

- [ ] **Step 3: Test the wizard runs (dry run — Ctrl+C after first prompt)**

```bash
npm run setup
```

Expected: Prompts appear; press Ctrl+C to exit without making changes.

- [ ] **Step 4: Commit**

```bash
git add scripts/setup.ts package.json
git commit -m "feat: add npm run setup CLI wizard"
```

---

## Task 12: Update seed.ts to use business types

**Files:**
- Modify: `prisma/seed.ts`

The new seed.ts uses the clothing business type by default. It uses the same `seedFromBusinessType` helper that the setup wizard generates, so the seed and the wizard produce identical schemas.

- [ ] **Step 1: Replace `prisma/seed.ts`**

```typescript
import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import bcrypt from 'bcryptjs'
import 'dotenv/config'
import { clothing } from '../business-types'

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! })
const prisma = new PrismaClient({ adapter })

type BT = typeof clothing

async function seedFromBusinessType(bt: BT) {
  const categoryMap: Record<string, { id: string }> = {}

  for (const cat of bt.defaultCategories) {
    const created = await prisma.category.upsert({
      where: { slug: cat.slug },
      update: {},
      create: { slug: cat.slug, name: cat.name },
    })
    categoryMap[cat.slug] = created
  }

  for (const sp of bt.sampleProducts) {
    const category = categoryMap[sp.categorySlug]
    if (!category) continue

    const hasOptions =
      sp.variants.length > 0 && Object.keys(sp.variants[0].options).length > 0
    const optionAxes = bt.variantAxes.filter((axis) =>
      sp.variants.some((v) => axis.name in v.options)
    )

    // Delete existing product so seed is idempotent
    const existing = await prisma.product.findUnique({ where: { slug: sp.slug } })
    if (existing) await prisma.product.delete({ where: { slug: sp.slug } })

    await prisma.product.create({
      data: {
        slug: sp.slug,
        name: sp.name,
        description: sp.description,
        images: sp.images,
        categoryId: category.id,
        options: hasOptions
          ? {
              create: optionAxes.map((axis, axisIdx) => ({
                name: axis.name,
                position: axisIdx,
                values: {
                  create: axis.values.map((val, valIdx) => ({
                    value: val,
                    position: valIdx,
                  })),
                },
              })),
            }
          : undefined,
      },
    })

    // Create variants with optionValue connections
    const product = await prisma.product.findUnique({
      where: { slug: sp.slug },
      include: { options: { include: { values: true } } },
    })
    if (!product) continue

    for (const sv of sp.variants) {
      const optionValueIds: string[] = []
      for (const [axisName, axisValue] of Object.entries(sv.options)) {
        const option = product.options.find((o) => o.name === axisName)
        const optionValue = option?.values.find((v) => v.value === axisValue)
        if (optionValue) optionValueIds.push(optionValue.id)
      }

      await prisma.productVariant.create({
        data: {
          productId: product.id,
          price: sv.price,
          compareAtPrice: sv.compareAtPrice ?? null,
          stock: sv.stock,
          sku: sv.sku ?? null,
          optionValues:
            optionValueIds.length > 0
              ? { connect: optionValueIds.map((id) => ({ id })) }
              : undefined,
        },
      })
    }
  }
}

async function main() {
  await seedFromBusinessType(clothing)

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

- [ ] **Step 2: Run seed against the migrated database**

```bash
npx prisma db seed
```

Expected: `✅ Seed completed` with no errors. Products are created with options and variants.

- [ ] **Step 3: Verify in Prisma Studio**

```bash
npx prisma studio
```

Check:
- `ProductOption` table has rows for "Talle" and "Color"
- `ProductOptionValue` table has rows for "XS", "S", "M", "L", "XL", "XXL", "#000000", "#ffffff", "#1d4ed8", "#dc2626"
- `ProductVariant` table has rows with price and stock per variant

- [ ] **Step 4: Run all tests**

```bash
npm test
```

Expected: All tests PASS.

- [ ] **Step 5: Commit**

```bash
git add prisma/seed.ts
git commit -m "feat: update seed to use clothing BusinessType profile"
```

---

## Task 13: Update CLAUDE.md with AI Quick Setup section

**Files:**
- Modify: `CLAUDE.md`

- [ ] **Step 1: Add the AI Quick Setup section to CLAUDE.md**

Append the following section to the end of `CLAUDE.md`:

```markdown
## AI Quick Setup

This template ships with four business type profiles that define variant axes, categories, and sample products. When a developer asks you to "set up a [type] store", follow this flow:

### Step 1 — Choose a business type

| ID | Name | Variant axes | Categories |
|---|---|---|---|
| `clothing` | Ropa | Talle (XS–XXL) × Color | Hombre, Mujer, Niños, Accesorios |
| `footwear` | Zapatería | Talle (35–46) × Color | Deportivo, Casual, Niños |
| `electronics` | Electrónica | Color × Garantía | Audio, Móviles, Computación |
| `food` | Comida / Nutrición | Sabor × Tamaño | Proteínas, Snacks, Bebidas |

Read the profile file at `business-types/<id>.ts` to understand the available axes and sample products.

### Step 2 — Edit `client.config.ts`

Update at minimum: `name`, `tagline`, `theme.primary`, `whatsapp.number`, `checkout.mode`.

### Step 3 — Generate `prisma/seed.ts`

Change the import at the top of `prisma/seed.ts` from `clothing` to the chosen business type:

```typescript
import { footwear } from '../business-types'  // ← change this
// ...
await seedFromBusinessType(footwear)           // ← and this
```

The `seedFromBusinessType` function reads the profile and creates categories, options, option values, and variants automatically.

### Step 4 — Run migration and seed

```bash
npx prisma migrate dev --name setup
npx prisma db seed
```

### Creating a new business type

If the client's business doesn't fit any existing profile, create `business-types/my-type.ts` implementing the `BusinessType` interface from `business-types/base.ts`, then add it to the registry in `business-types/index.ts`.

Key rules:
- `variantAxes`: list all option axes the business uses. Hex colors (`#rrggbb`) render as color circles in the UI; all other values render as text buttons.
- `sampleProducts`: each `SampleProductVariant.options` is a `Record<axisName, axisValue>`. For products with no options, use `options: {}` — these get a "Default" variant.
- `suggestedConfig`: partial `ClientConfig` values that make sense for this business type.
```

- [ ] **Step 2: Commit**

```bash
git add CLAUDE.md
git commit -m "docs: add AI Quick Setup section to CLAUDE.md"
```

---

## Self-Review Checklist

After all tasks complete, verify:

- [ ] `npm test` — all tests pass (products, cart, VariantSelector)
- [ ] `npx tsc --noEmit` — zero TypeScript errors
- [ ] `npm run dev` — app starts; product catalog shows "Desde $X" for multi-variant products; product detail shows VariantSelector; cart items show variant label
- [ ] `npm run setup` — wizard prompts appear, responds to input, generates files
- [ ] `npx prisma db seed` — seeds clothing data with options, option values, and variants

---

## What's Next: Plan B (Admin Panel)

Plan B depends on Plan A having completed the schema changes. It adds:
- Protected `/admin/*` routes (middleware auth check on `User.role === 'admin'`)
- Dashboard, product editor (with variant matrix), orders list/detail, coupons
- Image upload API (`POST /api/admin/upload`)
- Admin user in seed (`admin@example.com / admin123`)

Plan B will be written as a separate document.
