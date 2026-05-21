import type { CartItem } from '@/lib/data/types'
import type { CheckoutAdapter } from './types'

interface QRConfig {
  imageUrl: string
  instructions: string
  onShow: (imageUrl: string, instructions: string) => void
}

export class QRAdapter implements CheckoutAdapter {
  name = 'qr'
  private config: QRConfig

  constructor(config: QRConfig) {
    this.config = config
  }

  async handleCheckout(_items: CartItem[], _total: number): Promise<void> {
    this.config.onShow(this.config.imageUrl, this.config.instructions)
  }
}
