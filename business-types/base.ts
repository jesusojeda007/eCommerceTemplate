export interface VariantAxis {
  name: string      // "Talle", "Sabor", "Almacenamiento"
  values: string[]  // ["S","M","L"] or ["#000000","#ffffff"]
}

export interface SampleProductVariant {
  options: Record<string, string>  // { Talle: "M", Color: "#000000" }
  price: number
  compareAtPrice?: number
  stock: number
  sku?: string
}

export interface SampleProduct {
  name: string
  slug: string
  description: string
  categorySlug: string
  images: string[]
  variants: SampleProductVariant[]
}

export interface BusinessType {
  id: string
  name: string
  description: string
  variantAxes: VariantAxis[]
  defaultCategories: { name: string; slug: string }[]
  sampleProducts: SampleProduct[]
  suggestedConfig: {
    tagline?: string
    theme?: { primary?: string }
    checkout?: { mode?: 'whatsapp' | 'qr' | 'payment' }
  }
}
