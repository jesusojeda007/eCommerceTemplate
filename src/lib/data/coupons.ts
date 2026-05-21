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
