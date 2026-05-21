import config from '../../../client.config'
import { WhatsAppAdapter } from './whatsapp'
import { PlaceholderAdapter } from './placeholder'
import type { CheckoutAdapter } from './types'

export function getCheckoutAdapter(
  onShowQR?: (img: string, instructions: string) => void
): CheckoutAdapter {
  switch (config.checkout.mode) {
    case 'whatsapp':
      return new WhatsAppAdapter(config.whatsapp)
    case 'qr': {
      const { QRAdapter } = require('./qr')
      return new QRAdapter({
        imageUrl: config.checkout.qr?.imageUrl ?? '',
        instructions: config.checkout.qr?.instructions ?? '',
        onShow: onShowQR ?? (() => {}),
      })
    }
    case 'payment':
    default:
      return new PlaceholderAdapter()
  }
}

export type { CheckoutAdapter }
