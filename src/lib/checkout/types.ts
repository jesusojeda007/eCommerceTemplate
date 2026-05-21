import type { CartItem, Customer } from '@/lib/data/types'

export interface CheckoutAdapter {
  name: string
  handleCheckout(items: CartItem[], total: number, customer?: Customer): Promise<void>
}
