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
        optionId: v.optionId,
        value: v.value,
        position: v.position,
      })),
    })),
    variants: p.variants.map((v: any) => ({
      id: v.id,
      productId: v.productId,
      sku: v.sku,
      price: v.price.toNumber(),
      compareAtPrice: v.compareAtPrice ? v.compareAtPrice.toNumber() : null,
      stock: v.stock,
      optionValues: v.optionValues.map((ov: any) => ({
        id: ov.id,
        optionId: ov.optionId,
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
