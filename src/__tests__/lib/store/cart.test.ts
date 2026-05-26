import { renderHook, act } from '@testing-library/react'
import { useCartStore } from '@/lib/store/cart'
import type { Product, ProductVariant } from '@/lib/data/types'

const baseVariant: ProductVariant = {
  id: 'var1',
  productId: 'p1',
  sku: null,
  price: 100,
  compareAtPrice: null,
  stock: 20,
  optionValues: [],
}

const altVariant: ProductVariant = {
  id: 'var2',
  productId: 'p1',
  sku: null,
  price: 120,
  compareAtPrice: null,
  stock: 5,
  optionValues: [],
}

const baseProduct: Product = {
  id: 'p1',
  slug: 'test',
  name: 'Test Product',
  description: '',
  images: [],
  categoryId: 'c1',
  category: { id: 'c1', slug: 'cat', name: 'Cat' },
  volumeDiscounts: [],
  options: [],
  variants: [baseVariant],
}

const productWithVolumeDiscount: Product = {
  ...baseProduct,
  id: 'p2',
  slug: 'vol',
  volumeDiscounts: [
    { id: 'd1', minQty: 3, type: 'percent', value: 10, productId: 'p2' },
  ],
}

describe('cart store', () => {
  beforeEach(() => {
    useCartStore.setState({ items: [], coupon: null, couponError: null })
  })

  it('adds an item with variant', () => {
    const { result } = renderHook(() => useCartStore())
    act(() => result.current.addItem(baseProduct, baseVariant))
    expect(result.current.items).toHaveLength(1)
    expect(result.current.items[0].variant.id).toBe('var1')
    expect(result.current.items[0].quantity).toBe(1)
    expect(result.current.items[0].unitPrice).toBe(100)
    expect(result.current.items[0].basePrice).toBe(100)
    expect(result.current.items[0].variantLabel).toBe('Default')
  })

  it('increments quantity when adding same variant', () => {
    const { result } = renderHook(() => useCartStore())
    act(() => result.current.addItem(baseProduct, baseVariant))
    act(() => result.current.addItem(baseProduct, baseVariant))
    expect(result.current.items[0].quantity).toBe(2)
  })

  it('keeps separate cart items for different variants of same product', () => {
    const { result } = renderHook(() => useCartStore())
    act(() => result.current.addItem(baseProduct, baseVariant))
    act(() => result.current.addItem(baseProduct, altVariant))
    expect(result.current.items).toHaveLength(2)
  })

  it('removes an item by variantId', () => {
    const { result } = renderHook(() => useCartStore())
    act(() => result.current.addItem(baseProduct, baseVariant))
    act(() => result.current.removeItem('var1'))
    expect(result.current.items).toHaveLength(0)
  })

  it('applies volume discount when quantity threshold met', () => {
    const { result } = renderHook(() => useCartStore())
    act(() => result.current.addItem(productWithVolumeDiscount, baseVariant, 3))
    expect(result.current.items[0].unitPrice).toBe(90) // 100 * (1 - 0.10)
    expect(result.current.items[0].basePrice).toBe(100) // unchanged
  })

  it('does not apply volume discount below threshold', () => {
    const { result } = renderHook(() => useCartStore())
    act(() => result.current.addItem(productWithVolumeDiscount, baseVariant, 2))
    expect(result.current.items[0].unitPrice).toBe(100)
  })

  it('getSummary uses basePrice for subtotal (before volume discount)', () => {
    const { result } = renderHook(() => useCartStore())
    act(() => result.current.addItem(productWithVolumeDiscount, baseVariant, 3)) // unitPrice=90
    const { subtotal, volumeDiscount } = result.current.getSummary()
    expect(subtotal).toBe(300) // basePrice(100) * qty(3)
    expect(volumeDiscount).toBe(30) // 300 - 270
  })

  it('applies percent coupon to subtotal', () => {
    const { result } = renderHook(() => useCartStore())
    act(() => result.current.addItem(baseProduct, baseVariant, 2)) // subtotal = 200
    act(() =>
      result.current.applyCoupon({
        code: 'TEST20',
        type: 'percent',
        value: 20,
        minOrderAmount: null,
        expiresAt: null,
        active: true,
      })
    )
    const { subtotal, couponDiscount, total } = result.current.getSummary()
    expect(subtotal).toBe(200)
    expect(couponDiscount).toBe(40)
    expect(total).toBe(160)
  })

  it('applies fixed coupon to subtotal', () => {
    const { result } = renderHook(() => useCartStore())
    act(() => result.current.addItem(baseProduct, baseVariant, 1))
    act(() =>
      result.current.applyCoupon({
        code: 'OFF10',
        type: 'fixed',
        value: 10,
        minOrderAmount: null,
        expiresAt: null,
        active: true,
      })
    )
    const { total } = result.current.getSummary()
    expect(total).toBe(90)
  })

  it('rejects coupon below min order amount', () => {
    const { result } = renderHook(() => useCartStore())
    act(() => result.current.addItem(baseProduct, baseVariant, 1)) // subtotal = 100
    act(() =>
      result.current.applyCoupon({
        code: 'MIN200',
        type: 'fixed',
        value: 20,
        minOrderAmount: 200,
        expiresAt: null,
        active: true,
      })
    )
    expect(result.current.coupon).toBeNull()
    expect(result.current.couponError).toMatch(/mínimo/)
  })

  it('clears cart', () => {
    const { result } = renderHook(() => useCartStore())
    act(() => result.current.addItem(baseProduct, baseVariant))
    act(() => result.current.clearCart())
    expect(result.current.items).toHaveLength(0)
  })
})
