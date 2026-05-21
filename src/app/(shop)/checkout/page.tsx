'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Separator } from '@/components/ui/separator'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { useCartStore } from '@/lib/store/cart'
import { getCheckoutAdapter } from '@/lib/checkout'
import config from '../../../../client.config'

export default function CheckoutPage() {
  const router = useRouter()
  const { items, getSummary, clearCart } = useCartStore()
  const { subtotal, couponDiscount, total } = getSummary()

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [qrModal, setQrModal] = useState<{ imageUrl: string; instructions: string } | null>(null)

  if (items.length === 0) {
    router.replace('/cart')
    return null
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)

    try {
      const adapter = getCheckoutAdapter((imageUrl, instructions) => {
        setQrModal({ imageUrl, instructions })
      })

      await adapter.handleCheckout(items, total, { name, email })

      if (config.checkout.mode === 'whatsapp') {
        clearCart()
        router.push('/')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto max-w-2xl px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Checkout</h1>

      <div className="rounded-lg border p-6 mb-6 space-y-2 text-sm">
        {items.map((item) => (
          <div key={item.product.id} className="flex justify-between">
            <span>{item.product.name} x{item.quantity}</span>
            <span>${(item.unitPrice * item.quantity).toFixed(2)}</span>
          </div>
        ))}
        <Separator className="my-2" />
        {couponDiscount > 0 && (
          <div className="flex justify-between text-green-600">
            <span>Descuento</span>
            <span>-${couponDiscount.toFixed(2)}</span>
          </div>
        )}
        <div className="flex justify-between font-bold text-base">
          <span>Total</span>
          <span>${total.toFixed(2)}</span>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="name">Nombre completo</Label>
          <Input
            id="name"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Tu nombre"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="tu@email.com"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-2 px-4 rounded-md text-white font-medium transition-opacity hover:opacity-90 disabled:opacity-50"
          style={{ backgroundColor: 'var(--brand-primary)' }}
        >
          {loading
            ? 'Procesando...'
            : config.checkout.mode === 'whatsapp'
            ? 'Confirmar pedido por WhatsApp'
            : config.checkout.mode === 'qr'
            ? 'Ver QR de pago'
            : 'Confirmar pedido'}
        </button>
      </form>

      <Dialog open={!!qrModal} onOpenChange={() => setQrModal(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Pago con QR</DialogTitle>
          </DialogHeader>
          {qrModal && (
            <div className="flex flex-col items-center gap-4 py-4">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={qrModal.imageUrl} alt="QR de pago" className="w-48 h-48 object-contain" />
              <p className="text-sm text-center text-muted-foreground">{qrModal.instructions}</p>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
