'use client'

import { Button } from '@/components/ui/button'
import { useCartStore } from '@/lib/store/cart'
import type { Product, ProductVariant } from '@/lib/data/types'

interface AddToCartButtonProps {
  product: Product
  variant?: ProductVariant
  disabled?: boolean
}

export function AddToCartButton({ product, variant, disabled }: AddToCartButtonProps) {
  const addItem = useCartStore((s) => s.addItem)

  // For products with no options, use the Default variant automatically
  const effectiveVariant = variant ?? (product.options.length === 0 ? product.variants[0] : null)
  const isOutOfStock = effectiveVariant ? effectiveVariant.stock === 0 : false
  const isDisabled = disabled || !effectiveVariant || isOutOfStock

  const handleClick = () => {
    if (!effectiveVariant) return
    addItem(product, effectiveVariant)
  }

  return (
    <Button
      className="w-full"
      style={{ backgroundColor: 'var(--brand-primary)' }}
      onClick={handleClick}
      disabled={isDisabled}
    >
      {isOutOfStock ? 'Sin stock' : 'Agregar al carrito'}
    </Button>
  )
}
