export interface Category {
  id: string
  slug: string
  name: string
}

export interface VolumeDiscount {
  id: string
  minQty: number
  type: 'percent' | 'fixed'
  value: number
  productId: string
}

export interface ProductOptionValue {
  id: string
  value: string
  position: number
}

export interface ProductOption {
  id: string
  name: string
  position: number
  values: ProductOptionValue[]
}

export interface ProductVariant {
  id: string
  sku: string | null
  price: number
  compareAtPrice: number | null
  stock: number
  optionValues: ProductOptionValue[]
}

export interface Product {
  id: string
  slug: string
  name: string
  description: string
  images: string[]
  categoryId: string
  category: Category
  volumeDiscounts: VolumeDiscount[]
  options: ProductOption[]
  variants: ProductVariant[]
}

export interface Coupon {
  code: string
  type: 'percent' | 'fixed'
  value: number
  minOrderAmount: number | null
  expiresAt: Date | null
  active: boolean
}

export interface ProductFilters {
  categorySlug?: string
  minPrice?: number
  maxPrice?: number
  search?: string
}

export interface CartItem {
  product: Product
  variant: ProductVariant
  variantLabel: string       // "Talle: M / Color: Rojo" or "Default"
  quantity: number
  unitPrice: number          // after volume discount
  basePrice: number          // variant.price before discount
}

export interface Customer {
  name: string
  email: string
  phone?: string
}
