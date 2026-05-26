import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { CartItem, Coupon, Product, ProductVariant } from '@/lib/data/types'
import config from '../../../client.config'

function buildVariantLabel(product: Product, variant: ProductVariant): string {
  if (product.options.length === 0) return 'Default'
  return product.options
    .map((opt) => {
      const val = variant.optionValues.find((ov) =>
        opt.values.some((v) => v.id === ov.id)
      )
      return val ? `${opt.name}: ${val.value}` : opt.name
    })
    .join(' / ')
}

function applyVolumeDiscount(product: Product, variant: ProductVariant, quantity: number): number {
  if (!config.discounts.volumeDiscountsEnabled || !product.volumeDiscounts.length) return variant.price

  const applicable = product.volumeDiscounts
    .filter((d) => quantity >= d.minQty)
    .sort((a, b) => b.minQty - a.minQty)[0]

  if (!applicable) return variant.price

  if (applicable.type === 'percent') {
    return variant.price * (1 - applicable.value / 100)
  }
  return Math.max(0, variant.price - applicable.value)
}

interface CartSummary {
  subtotal: number
  volumeDiscount: number
  couponDiscount: number
  total: number
}

interface CartStore {
  items: CartItem[]
  coupon: Coupon | null
  couponError: string | null

  addItem: (product: Product, variant: ProductVariant, quantity?: number) => void
  removeItem: (variantId: string) => void
  updateQuantity: (variantId: string, quantity: number) => void
  applyCoupon: (coupon: Coupon) => void
  removeCoupon: () => void
  clearCart: () => void
  getSummary: () => CartSummary
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      coupon: null,
      couponError: null,

      addItem: (product, variant, quantity = 1) => {
        set((state) => {
          const existing = state.items.find((i) => i.variant.id === variant.id)
          if (existing) {
            const newQty = existing.quantity + quantity
            return {
              items: state.items.map((i) =>
                i.variant.id === variant.id
                  ? { ...i, quantity: newQty, unitPrice: applyVolumeDiscount(product, variant, newQty) }
                  : i
              ),
            }
          }
          return {
            items: [
              ...state.items,
              {
                product,
                variant,
                variantLabel: buildVariantLabel(product, variant),
                quantity,
                basePrice: variant.price,
                unitPrice: applyVolumeDiscount(product, variant, quantity),
              },
            ],
          }
        })
      },

      removeItem: (variantId) =>
        set((state) => ({ items: state.items.filter((i) => i.variant.id !== variantId) })),

      updateQuantity: (variantId, quantity) => {
        if (quantity <= 0) {
          get().removeItem(variantId)
          return
        }
        set((state) => ({
          items: state.items.map((i) =>
            i.variant.id === variantId
              ? { ...i, quantity, unitPrice: applyVolumeDiscount(i.product, i.variant, quantity) }
              : i
          ),
        }))
      },

      applyCoupon: (coupon) => {
        const { getSummary } = get()
        const { subtotal } = getSummary()
        if (coupon.minOrderAmount && subtotal < coupon.minOrderAmount) {
          set({ couponError: `mínimo de compra: $${coupon.minOrderAmount}`, coupon: null })
          return
        }
        set({ coupon, couponError: null })
      },

      removeCoupon: () => set({ coupon: null, couponError: null }),

      clearCart: () => set({ items: [], coupon: null, couponError: null }),

      getSummary: (): CartSummary => {
        const { items, coupon } = get()
        const subtotal = items.reduce((sum, i) => sum + i.unitPrice * i.quantity, 0)
        const baseSubtotal = items.reduce((sum, i) => sum + i.basePrice * i.quantity, 0)
        const volumeDiscount = baseSubtotal - subtotal

        let couponDiscount = 0
        if (coupon) {
          couponDiscount =
            coupon.type === 'percent'
              ? subtotal * (coupon.value / 100)
              : Math.min(coupon.value, subtotal)
        }
        return {
          subtotal: baseSubtotal,
          volumeDiscount,
          couponDiscount,
          total: Math.max(0, subtotal - couponDiscount),
        }
      },
    }),
    { name: 'cart-store' }
  )
)
