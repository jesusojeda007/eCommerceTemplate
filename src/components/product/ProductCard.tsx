import Link from 'next/link'
import Image from 'next/image'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { AddToCartButton } from './AddToCartButton'
import type { Product } from '@/lib/data/types'

interface ProductCardProps {
  product: Product
}

export function ProductCard({ product }: ProductCardProps) {
  const prices = product.variants.map((v) => v.price)
  const minPrice = Math.min(...prices)
  const maxPrice = Math.max(...prices)
  const hasMultiplePrices = minPrice !== maxPrice

  // Use cheapest variant for discount badge
  const cheapestVariant = product.variants.find((v) => v.price === minPrice)
  const hasDiscount =
    !hasMultiplePrices &&
    cheapestVariant?.compareAtPrice &&
    cheapestVariant.compareAtPrice > minPrice
  const discountPct = hasDiscount
    ? Math.round((1 - minPrice / cheapestVariant!.compareAtPrice!) * 100)
    : 0

  return (
    <Card className="group overflow-hidden">
      <Link href={`/products/${product.slug}`}>
        <div className="relative aspect-square overflow-hidden bg-muted">
          <Image
            src={product.images[0] ?? '/placeholder.png'}
            alt={product.name}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-105"
          />
          {hasDiscount && (
            <Badge className="absolute top-2 left-2 bg-red-500 text-white">
              -{discountPct}%
            </Badge>
          )}
        </div>
      </Link>
      <CardContent className="p-4">
        <Link href={`/products/${product.slug}`}>
          <h3 className="font-medium line-clamp-2 hover:underline">{product.name}</h3>
        </Link>
        <div className="mt-1 flex items-center gap-2">
          {hasMultiplePrices ? (
            <span className="text-lg font-bold">Desde ${minPrice.toFixed(2)}</span>
          ) : (
            <>
              <span className="text-lg font-bold">${minPrice.toFixed(2)}</span>
              {hasDiscount && (
                <span className="text-sm text-muted-foreground line-through">
                  ${cheapestVariant!.compareAtPrice!.toFixed(2)}
                </span>
              )}
            </>
          )}
        </div>
      </CardContent>
      <CardFooter className="p-4 pt-0">
        {product.options.length > 0 ? (
          <Link href={`/products/${product.slug}`} className="w-full">
            <Button variant="outline" className="w-full">
              Ver opciones
            </Button>
          </Link>
        ) : (
          <AddToCartButton product={product} />
        )}
      </CardFooter>
    </Card>
  )
}
