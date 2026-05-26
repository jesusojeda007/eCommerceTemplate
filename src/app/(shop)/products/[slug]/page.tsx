import { notFound } from 'next/navigation'
import Image from 'next/image'
import { getProduct } from '@/lib/data/products'
import { ProductInfo } from '@/components/product/ProductInfo'

interface PageProps {
  params: Promise<{ slug: string }>
}

export default async function ProductPage({ params }: PageProps) {
  const { slug } = await params
  const product = await getProduct(slug)

  if (!product) notFound()

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
        </div>

        {/* Info */}
        <div className="flex flex-col gap-4">
          <div>
            <p className="text-sm text-muted-foreground">{product.category.name}</p>
            <h1 className="text-3xl font-bold mt-1">{product.name}</h1>
          </div>

          <p className="text-muted-foreground leading-relaxed">{product.description}</p>

          <ProductInfo product={product} />
        </div>
      </div>
    </div>
  )
}
