import type { CartItem } from '@/lib/data/types'
import type { CheckoutAdapter } from './types'

export class PlaceholderAdapter implements CheckoutAdapter {
  name = 'payment'

  async handleCheckout(_items: CartItem[], _total: number): Promise<void> {
    alert('Sistema de pagos próximamente disponible.')
  }
}
