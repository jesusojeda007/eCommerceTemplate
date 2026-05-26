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
  updatedAt: new Date(),
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
          { id: 'v1', optionId: 'opt1', value: 'S', position: 0 },
          { id: 'v2', optionId: 'opt1', value: 'M', position: 1 },
        ],
      }],
      variants: [
        { ...mockVariant, optionValues: [{ id: 'v1', optionId: 'opt1', value: 'S', position: 0 }] },
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
