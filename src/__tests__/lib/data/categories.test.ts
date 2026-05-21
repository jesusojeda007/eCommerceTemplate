jest.mock('@/lib/db', () => ({
  prisma: {
    category: { findMany: jest.fn() },
  },
}))

import { getCategories } from '@/lib/data/categories'
import { prisma } from '@/lib/db'

describe('getCategories', () => {
  it('returns categories ordered by name', async () => {
    ;(prisma.category.findMany as jest.Mock).mockResolvedValue([
      { id: 'c1', slug: 'ropa', name: 'Ropa' },
      { id: 'c2', slug: 'accesorios', name: 'Accesorios' },
    ])
    const categories = await getCategories()
    expect(categories).toHaveLength(2)
    expect(prisma.category.findMany).toHaveBeenCalledWith({ orderBy: { name: 'asc' } })
  })
})
