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

  it('maps minOrderAmount correctly', async () => {
    ;(prisma.coupon.findUnique as jest.Mock).mockResolvedValue({
      code: 'MIN50',
      type: 'fixed',
      value: { toNumber: () => 15 },
      minOrderAmount: { toNumber: () => 50 },
      expiresAt: null,
      active: true,
    })
    const result = await validateCoupon('MIN50')
    expect(result?.minOrderAmount).toBe(50)
  })
})
