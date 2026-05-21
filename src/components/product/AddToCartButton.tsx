'use client'

import { Button } from '@/components/ui/button'
import { useCartStore } from '@/lib/store/cart'
import type { Product } from '@/lib/data/types'

export function AddToCartButton({ product }: { product: Product }) {
  const addItem = useCartStore((s) => s.addItem)

  return (
    <Button
      className="w-full"
      style={{ backgroundColor: 'var(--brand-primary)' }}
      onClick={() => addItem(product)}
      disabled={product.stock === 0}
    >
      {product.stock === 0 ? 'Sin stock' : 'Agregar al carrito'}
    </Button>
  )
}
