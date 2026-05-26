'use client'

import Image from 'next/image'
import { Trash2 } from 'lucide-react'
import { useCartStore } from '@/lib/store/cart'
import type { CartItem as CartItemType } from '@/lib/data/types'

export function CartItem({ item }: { item: CartItemType }) {
  const { updateQuantity, removeItem } = useCartStore()
  const lineTotal = item.unitPrice * item.quantity
  const hasVolumeDiscount = item.unitPrice < item.basePrice

  return (
    <div className="flex gap-4 py-4 border-b last:border-0">
      <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-md bg-muted">
        <Image
          src={item.product.images[0] ?? '/placeholder.png'}
          alt={item.product.name}
          fill
          className="object-cover"
        />
      </div>
      <div className="flex flex-1 flex-col gap-1">
        <p className="font-medium">{item.product.name}</p>
        {item.variantLabel !== 'Default' && (
          <p className="text-xs text-muted-foreground">{item.variantLabel}</p>
        )}
        <div className="text-sm text-muted-foreground">
          {hasVolumeDiscount ? (
            <span className="text-green-600">${item.unitPrice.toFixed(2)} c/u (desc. volumen)</span>
          ) : (
            <span>${item.unitPrice.toFixed(2)} c/u</span>
          )}
        </div>
        <div className="flex items-center gap-2 mt-1">
          <button
            onClick={() => updateQuantity(item.variant.id, item.quantity - 1)}
            className="h-6 w-6 rounded border border-input flex items-center justify-center text-sm hover:bg-muted"
          >
            -
          </button>
          <span className="text-sm w-6 text-center">{item.quantity}</span>
          <button
            onClick={() => updateQuantity(item.variant.id, item.quantity + 1)}
            className="h-6 w-6 rounded border border-input flex items-center justify-center text-sm hover:bg-muted disabled:opacity-50"
            disabled={item.quantity >= item.variant.stock}
          >
            +
          </button>
        </div>
      </div>
      <div className="flex flex-col items-end justify-between">
        <span className="font-semibold">${lineTotal.toFixed(2)}</span>
        <button
          onClick={() => removeItem(item.variant.id)}
          className="text-muted-foreground hover:text-destructive transition-colors"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}
