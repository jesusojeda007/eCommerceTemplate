'use client'

import Link from 'next/link'
import { useCartStore } from '@/lib/store/cart'
import { CartItem } from '@/components/cart/CartItem'
import { CartSummary } from '@/components/cart/CartSummary'

export default function CartPage() {
  const items = useCartStore((s) => s.items)

  if (items.length === 0) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <p className="text-lg text-muted-foreground mb-4">Tu carrito está vacío.</p>
        <Link
          href="/products"
          className="inline-block px-4 py-2 rounded-md border border-input hover:bg-muted text-sm transition-colors"
        >
          Ver productos
        </Link>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Tu carrito</h1>
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2">
          {items.map((item) => (
            <CartItem key={item.product.id} item={item} />
          ))}
        </div>
        <div>
          <CartSummary />
        </div>
      </div>
    </div>
  )
}
