'use client'

import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { useCartStore } from '@/lib/store/cart'

export function CouponInput() {
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)
  const { coupon, couponError, applyCoupon, removeCoupon } = useCartStore()

  async function handleApply() {
    if (!code.trim()) return
    setLoading(true)
    try {
      const res = await fetch(`/api/coupon/validate?code=${encodeURIComponent(code.trim())}`)
      const result = await res.json()
      if (!result) {
        useCartStore.setState({ couponError: 'Cupón inválido o expirado', coupon: null })
      } else {
        applyCoupon(result)
      }
    } finally {
      setLoading(false)
    }
  }

  if (coupon) {
    return (
      <div className="flex items-center justify-between text-sm">
        <span className="text-green-600 font-medium">Cupón {coupon.code} aplicado</span>
        <button onClick={removeCoupon} className="text-muted-foreground hover:text-foreground text-xs underline">
          Quitar
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <Input
          placeholder="Código de descuento"
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          className="flex-1"
        />
        <button
          onClick={handleApply}
          disabled={loading}
          className="px-4 py-2 rounded-md border border-input text-sm hover:bg-muted transition-colors disabled:opacity-50"
        >
          {loading ? '...' : 'Aplicar'}
        </button>
      </div>
      {couponError && <p className="text-xs text-red-500">{couponError}</p>}
    </div>
  )
}
