import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { CartItem, Coupon, Product } from '@/lib/data/types'
import config from '../../../client.config'

function applyVolumeDiscount(product: Product, quantity: number): number {
  if (!config.discounts.volumeDiscountsEnabled || !product.volumeDiscounts.length) return product.price

  const applicable = product.volumeDiscounts
    .filter((d) => quantity >= d.minQty)
    .sort((a, b) => b.minQty - a.minQty)[0]

  if (!applicable) return product.price

  if (applicable.type === 'percent') {
    return product.price * (1 - applicable.value / 100)
  }
  return Math.max(0, product.price - applicable.value)
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

  addItem: (product: Product, quantity?: number) => void
  removeItem: (productId: string) => void
  updateQuantity: (productId: string, quantity: number) => void
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

      addItem: (product, quantity = 1) => {
        set((state) => {
          const existing = state.items.find((i) => i.product.id === product.id)
          if (existing) {
            const newQty = existing.quantity + quantity
            return {
              items: state.items.map((i) =>
                i.product.id === product.id
                  ? { ...i, quantity: newQty, unitPrice: applyVolumeDiscount(product, newQty) }
                  : i
              ),
            }
          }
          return {
            items: [
              ...state.items,
              {
                product,
                quantity,
                unitPrice: applyVolumeDiscount(product, quantity),
              },
            ],
          }
        })
      },

      removeItem: (productId) =>
        set((state) => ({ items: state.items.filter((i) => i.product.id !== productId) })),

      updateQuantity: (productId, quantity) => {
        if (quantity <= 0) {
          get().removeItem(productId)
          return
        }
        set((state) => ({
          items: state.items.map((i) =>
            i.product.id === productId
              ? { ...i, quantity, unitPrice: applyVolumeDiscount(i.product, quantity) }
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
        const baseSubtotal = items.reduce((sum, i) => sum + i.product.price * i.quantity, 0)
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
