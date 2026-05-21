'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useCallback, useState } from 'react'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Slider } from '@/components/ui/slider'
import type { Category } from '@/lib/data/types'

const PRICE_MAX = 200

interface FilterSidebarProps {
  categories: Category[]
  initialMinPrice?: number
  initialMaxPrice?: number
}

export function FilterSidebar({ categories, initialMinPrice = 0, initialMaxPrice = PRICE_MAX }: FilterSidebarProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const activeCategory = searchParams.get('category') ?? ''
  const [priceRange, setPriceRange] = useState<[number, number]>([initialMinPrice, initialMaxPrice])

  const setParam = useCallback(
    (key: string, value: string | null) => {
      const params = new URLSearchParams(searchParams.toString())
      if (value) {
        params.set(key, value)
      } else {
        params.delete(key)
      }
      router.push(`/products?${params.toString()}`)
    },
    [router, searchParams]
  )

  const handlePriceChange = useCallback(
    (values: number | readonly number[]) => {
      const arr = Array.isArray(values) ? (values as readonly number[]) : [values as number, values as number]
      const [min, max] = arr as [number, number]
      setPriceRange([min, max])
      const params = new URLSearchParams(searchParams.toString())
      if (min > 0) {
        params.set('minPrice', String(min))
      } else {
        params.delete('minPrice')
      }
      if (max < PRICE_MAX) {
        params.set('maxPrice', String(max))
      } else {
        params.delete('maxPrice')
      }
      router.push(`/products?${params.toString()}`)
    },
    [router, searchParams]
  )

  return (
    <aside className="w-full md:w-56 shrink-0">
      <div className="space-y-4">
        <div>
          <Label className="text-base font-semibold">Categorías</Label>
          <Separator className="my-2" />
          <ul className="space-y-1">
            <li>
              <button
                onClick={() => setParam('category', null)}
                className={`text-sm w-full text-left px-2 py-1 rounded hover:bg-muted transition-colors ${
                  !activeCategory ? 'font-semibold text-foreground' : 'text-muted-foreground'
                }`}
              >
                Todos
              </button>
            </li>
            {categories.map((cat) => (
              <li key={cat.id}>
                <button
                  onClick={() => setParam('category', cat.slug)}
                  className={`text-sm w-full text-left px-2 py-1 rounded hover:bg-muted transition-colors ${
                    activeCategory === cat.slug
                      ? 'font-semibold text-foreground'
                      : 'text-muted-foreground'
                  }`}
                >
                  {cat.name}
                </button>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <Label className="text-base font-semibold">Precio</Label>
          <Separator className="my-2" />
          <div className="px-1">
            <Slider
              min={0}
              max={PRICE_MAX}
              value={priceRange}
              onValueChange={handlePriceChange}
              className="mb-3"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>${priceRange[0]}</span>
              <span>${priceRange[1]}</span>
            </div>
          </div>
        </div>
      </div>
    </aside>
  )
}
