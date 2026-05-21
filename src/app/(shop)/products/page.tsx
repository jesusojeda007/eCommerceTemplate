import { Suspense } from 'react'
import { getProducts } from '@/lib/data/products'
import { getCategories } from '@/lib/data/categories'
import { ProductGrid } from '@/components/product/ProductGrid'
import { FilterSidebar } from '@/components/filters/FilterSidebar'
import config from '../../../../client.config'

interface PageProps {
  searchParams: Promise<{ category?: string; search?: string }>
}

export default async function ProductsPage({ searchParams }: PageProps) {
  const params = await searchParams
  const [products, categories] = await Promise.all([
    getProducts({
      categorySlug: params.category,
      search: params.search,
    }),
    getCategories(),
  ])

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Productos</h1>
      <div className="flex flex-col md:flex-row gap-8">
        <Suspense>
          <FilterSidebar categories={categories} />
        </Suspense>
        <div className="flex-1">
          {config.features.searchBar && (
            <form className="mb-6">
              <input
                name="search"
                defaultValue={params.search}
                placeholder="Buscar productos..."
                className="w-full max-w-sm rounded-md border border-input px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
              />
            </form>
          )}
          <ProductGrid products={products} />
        </div>
      </div>
    </div>
  )
}
