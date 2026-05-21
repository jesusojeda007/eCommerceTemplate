'use client'

import { Separator } from '@/components/ui/separator'
import Link from 'next/link'
import { useCartStore } from '@/lib/store/cart'
import { CouponInput } from './CouponInput'
import config from '../../../client.config'

export function CartSummary() {
  const { getSummary, coupon } = useCartStore()
  const { subtotal, couponDiscount, total } = getSummary()

  return (
    <div className="rounded-lg border p-6 space-y-4 bg-muted/30">
      <h2 className="text-lg font-semibold">Resumen del pedido</h2>

      <div className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-muted-foreground">Subtotal</span>
          <span>${subtotal.toFixed(2)}</span>
        </div>
        {couponDiscount > 0 && (
          <div className="flex justify-between text-green-600">
            <span>Descuento ({coupon?.code})</span>
            <span>-${couponDiscount.toFixed(2)}</span>
          </div>
        )}
      </div>

      <Separator />

      <div className="flex justify-between font-bold text-base">
        <span>Total</span>
        <span>${total.toFixed(2)}</span>
      </div>

      {config.discounts.couponsEnabled && <CouponInput />}

      <Link
        href="/checkout"
        className="block w-full text-center py-2 px-4 rounded-md text-white font-medium transition-opacity hover:opacity-90"
        style={{ backgroundColor: 'var(--brand-primary)' }}
      >
        Ir al checkout
      </Link>
    </div>
  )
}
