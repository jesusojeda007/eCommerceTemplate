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

export interface Product {
  id: string
  slug: string
  name: string
  description: string
  images: string[]
  price: number
  compareAtPrice: number | null
  stock: number
  categoryId: string
  category: Category
  volumeDiscounts: VolumeDiscount[]
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
  quantity: number
  unitPrice: number
}

export interface Customer {
  name: string
  email: string
  phone?: string
}
