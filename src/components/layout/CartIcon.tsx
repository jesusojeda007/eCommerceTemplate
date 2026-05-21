'use client'

import Link from 'next/link'
import { ShoppingCart } from 'lucide-react'
import { useCartStore } from '@/lib/store/cart'

export function CartIcon() {
  const totalItems = useCartStore((s) => s.items.reduce((sum, i) => sum + i.quantity, 0))

  return (
    <Link href="/cart" className="relative inline-flex items-center justify-center rounded-lg p-2 hover:bg-muted transition-colors">
      <ShoppingCart className="h-5 w-5" />
      {totalItems > 0 && (
        <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-[var(--brand-primary)] text-[10px] text-white font-bold">
          {totalItems}
        </span>
      )}
    </Link>
  )
}
