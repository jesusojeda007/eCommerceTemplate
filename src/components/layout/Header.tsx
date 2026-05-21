import Link from 'next/link'
import config from '../../../client.config'
import { CartIcon } from './CartIcon'
import CartDrawer from '@/components/cart/CartDrawer'

export function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2">
          <span className="text-xl font-bold" style={{ color: config.theme.primary }}>
            {config.name}
          </span>
        </Link>

        <nav className="hidden md:flex items-center gap-6 text-sm">
          <Link href="/products" className="text-muted-foreground hover:text-foreground transition-colors">
            Productos
          </Link>
        </nav>

        <div className="flex items-center gap-2">
          {config.features.auth && (
            <Link href="/login" className="inline-flex items-center justify-center rounded-lg px-3 py-1 text-sm hover:bg-muted transition-colors">
              Entrar
            </Link>
          )}
          <CartDrawer trigger={<CartIcon />} />
        </div>
      </div>
    </header>
  )
}
