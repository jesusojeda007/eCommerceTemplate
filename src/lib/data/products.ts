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
