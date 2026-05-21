import { NextResponse } from 'next/server'
import { validateCoupon } from '@/lib/data/coupons'

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const code = searchParams.get('code')
  if (!code) return NextResponse.json(null)

  const coupon = await validateCoupon(code)
  return NextResponse.json(coupon)
}
