import { prisma } from '@/lib/db'
import type { Category } from './types'

export async function getCategories(): Promise<Category[]> {
  return prisma.category.findMany({ orderBy: { name: 'asc' } })
}
