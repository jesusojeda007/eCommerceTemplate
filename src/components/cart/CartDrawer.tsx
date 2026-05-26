'use client'

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import { useCartStore } from '@/lib/store/cart'
import { CartItem } from './CartItem'
import { CartSummary } from './CartSummary'
import Link from 'next/link'

interface CartDrawerProps {
  trigger: React.ReactNode
}

export default function CartDrawer({ trigger }: CartDrawerProps) {
  const items = useCartStore((s) => s.items)

  return (
    <Sheet>
      <SheetTrigger render={<span />} className="relative inline-flex items-center justify-center rounded-lg p-0">
        {trigger}
      </SheetTrigger>
      <SheetContent className="flex flex-col w-full sm:max-w-md p-4">
        <SheetHeader>
          <SheetTitle>Tu carrito</SheetTitle>
        </SheetHeader>
        {items.length === 0 ? (
          <p className="text-muted-foreground text-sm mt-4">Tu carrito está vacío.</p>
        ) : (
          <div className="flex flex-col flex-1 overflow-y-auto gap-4 mt-4">
            {items.map((item) => (
              <CartItem key={item.variant.id} item={item} />
            ))}
            <CartSummary hideCheckoutLink />
            <Link
              href="/checkout"
              className="w-full block text-center py-2 px-4 rounded text-white font-medium"
              style={{ backgroundColor: 'var(--brand-primary)' }}
            >
              Ir al checkout
            </Link>
          </div>
        )}
      </SheetContent>
    </Sheet>
  )
}
