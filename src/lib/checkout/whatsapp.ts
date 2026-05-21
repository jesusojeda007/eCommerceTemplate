import type { CartItem } from '@/lib/data/types'
import type { CheckoutAdapter } from './types'
import type { Customer } from '@/lib/data/types'

interface WhatsAppConfig {
  number: string
  messageTemplate: string
}

export class WhatsAppAdapter implements CheckoutAdapter {
  name = 'whatsapp'
  private config: WhatsAppConfig

  constructor(config: WhatsAppConfig) {
    this.config = config
  }

  formatMessage(items: CartItem[], total: number): string {
    const itemLines = items
      .map((i) => `• ${i.product.name} x${i.quantity} — $${(i.unitPrice * i.quantity).toFixed(2)}`)
      .join('\n')

    return this.config.messageTemplate
      .replace('{items}', itemLines)
      .replace('{total}', total.toFixed(2))
  }

  buildUrl(items: CartItem[], total: number): string {
    const number = this.config.number.replace(/\D/g, '')
    const message = encodeURIComponent(this.formatMessage(items, total))
    return `https://wa.me/${number}?text=${message}`
  }

  async handleCheckout(items: CartItem[], total: number, _customer?: Customer): Promise<void> {
    window.open(this.buildUrl(items, total), '_blank')
  }
}
