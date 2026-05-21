import Link from 'next/link'
import { getProducts } from '@/lib/data/products'
import { ProductGrid } from '@/components/product/ProductGrid'
import config from '../../../client.config'

export default async function HomePage() {
  const featured = await getProducts()
  const featuredSlice = featured.slice(0, 4)

  return (
    <div>
      {/* Hero */}
      <section
        className="py-20 px-4 text-center"
        style={{ backgroundColor: config.theme.primary + '15' }}
      >
        <h1 className="text-4xl font-bold mb-4" style={{ color: config.theme.primary }}>
          {config.name}
        </h1>
        <p className="text-lg text-muted-foreground mb-8 max-w-xl mx-auto">
          {config.tagline}
        </p>
        <Link
          href="/products"
          className="inline-block px-6 py-3 rounded-md text-white font-medium transition-opacity hover:opacity-90"
          style={{ backgroundColor: config.theme.primary }}
        >
          Ver productos
        </Link>
      </section>

      {/* Featured products */}
      <section className="container mx-auto px-4 py-12">
        <h2 className="text-2xl font-bold mb-6">Productos destacados</h2>
        <ProductGrid products={featuredSlice} />
        <div className="mt-8 text-center">
          <Link
            href="/products"
            className="inline-block px-4 py-2 rounded-md border border-input hover:bg-muted text-sm transition-colors"
          >
            Ver todos
          </Link>
        </div>
      </section>
    </div>
  )
}
