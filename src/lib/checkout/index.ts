import config from '../../../client.config'
import { WhatsAppAdapter } from './whatsapp'
import { PlaceholderAdapter } from './placeholder'
import { QRAdapter } from './qr'
import type { CheckoutAdapter } from './types'

export function getCheckoutAdapter(
  onShowQR?: (img: string, instructions: string) => void
): CheckoutAdapter {
  switch (config.checkout.mode) {
    case 'whatsapp':
      return new WhatsAppAdapter(config.whatsapp)
    case 'qr': {
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
