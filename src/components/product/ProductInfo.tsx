'use client'

import { useState } from 'react'
import type { Product, ProductVariant } from '@/lib/data/types'
import { VariantSelector } from './VariantSelector'
import { AddToCartButton } from './AddToCartButton'
import { Separator } from '@/components/ui/separator'

interface ProductInfoProps {
  product: Product
}

export function ProductInfo({ product }: ProductInfoProps) {
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(
    // Auto-select the Default variant for products with no option axes
    product.options.length === 0 ? (product.variants[0] ?? null) : null
  )

  const minPrice = Math.min(...product.variants.map((v) => v.price))
  const displayPrice = selectedVariant?.price ?? minPrice
  const displayCompareAt = selectedVariant?.compareAtPrice ?? null
  const hasDiscount = displayCompareAt !== null && displayCompareAt > displayPrice
  const discountPct = hasDiscount
    ? Math.round((1 - displayPrice / displayCompareAt!) * 100)
    : 0

  return (
    <>
      <div className="flex items-center gap-3">
        <span className="text-3xl font-bold">${displayPrice.toFixed(2)}</span>
        {hasDiscount && (
          <>
            <span className="text-lg text-muted-foreground line-through">
              ${displayCompareAt!.toFixed(2)}
            </span>
            <span className="text-sm bg-red-100 text-red-700 px-2 py-0.5 rounded">
              -{discountPct}%
            </span>
          </>
        )}
      </div>

      {product.volumeDiscounts.length > 0 && (
        <div className="rounded-md bg-muted p-3 text-sm space-y-1">
          <p className="font-medium">Descuentos por volumen:</p>
          {product.volumeDiscounts
            .sort((a, b) => a.minQty - b.minQty)
            .map((d) => (
              <p key={d.id} className="text-muted-foreground">
                • {d.minQty}+ unidades:{' '}
                {d.type === 'percent' ? `${d.value}% off` : `$${d.value} off c/u`}
              </p>
            ))}
        </div>
      )}

      <Separator />

      {product.options.length > 0 && (
        <VariantSelector
          options={product.options}
          variants={product.variants}
          selectedVariant={selectedVariant}
          onSelect={setSelectedVariant}
        />
      )}

      <p className="text-sm text-muted-foreground">
        Stock disponible:{' '}
        <span className="font-medium text-foreground">
          {selectedVariant ? selectedVariant.stock : '—'}
        </span>
      </p>

      <AddToCartButton
        product={product}
        variant={selectedVariant ?? undefined}
        disabled={product.options.length > 0 && selectedVariant === null}
      />
    </>
  )
}
