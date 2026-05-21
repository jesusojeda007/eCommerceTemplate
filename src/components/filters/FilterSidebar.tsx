'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useCallback } from 'react'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import type { Category } from '@/lib/data/types'

interface FilterSidebarProps {
  categories: Category[]
}

export function FilterSidebar({ categories }: FilterSidebarProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const activeCategory = searchParams.get('category') ?? ''

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
      </div>
    </aside>
  )
}
