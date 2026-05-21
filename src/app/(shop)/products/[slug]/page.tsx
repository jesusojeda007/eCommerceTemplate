import { notFound } from 'next/navigation'
import Image from 'next/image'
import { getProduct } from '@/lib/data/products'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { AddToCartButton } from '@/components/product/AddToCartButton'

interface PageProps {
  params: Promise<{ slug: string }>
}

export default async function ProductPage({ params }: PageProps) {
  const { slug } = await params
  const product = await getProduct(slug)

  if (!product) notFound()

  const hasDiscount = product.compareAtPrice && product.compareAtPrice > product.price
  const discountPct = hasDiscount
    ? Math.round((1 - product.price / product.compareAtPrice!) * 100)
    : 0

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
        {/* Image */}
        <div className="relative aspect-square overflow-hidden rounded-lg bg-muted">
          <Image
            src={product.images[0] ?? '/placeholder.png'}
            alt={product.name}
            fill
            className="object-cover"
            priority
          />
          {hasDiscount && (
            <Badge className="absolute top-3 left-3 bg-red-500 text-white text-sm px-2 py-1">
              -{discountPct}%
            </Badge>
          )}
        </div>

        {/* Info */}
        <div className="flex flex-col gap-4">
          <div>
            <p className="text-sm text-muted-foreground">{product.category.name}</p>
            <h1 className="text-3xl font-bold mt-1">{product.name}</h1>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-3xl font-bold">${product.price.toFixed(2)}</span>
            {hasDiscount && (
              <span className="text-lg text-muted-foreground line-through">
                ${product.compareAtPrice!.toFixed(2)}
              </span>
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

          <p className="text-muted-foreground leading-relaxed">{product.description}</p>

          <p className="text-sm text-muted-foreground">
            Stock disponible: <span className="font-medium text-foreground">{product.stock}</span>
          </p>

          <AddToCartButton product={product} />
        </div>
      </div>
    </div>
  )
}
