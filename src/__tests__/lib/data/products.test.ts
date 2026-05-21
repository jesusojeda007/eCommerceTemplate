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
