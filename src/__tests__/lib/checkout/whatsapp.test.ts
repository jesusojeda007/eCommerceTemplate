import { WhatsAppAdapter } from '@/lib/checkout/whatsapp'
import type { CartItem } from '@/lib/data/types'

const mockItem: CartItem = {
  product: {
    id: 'p1', slug: 'test', name: 'Camiseta', description: '', images: [],
    price: 25, compareAtPrice: null, stock: 10, categoryId: 'c1',
    category: { id: 'c1', slug: 'ropa', name: 'Ropa' }, volumeDiscounts: [],
  },
  quantity: 2,
  unitPrice: 25,
}

describe('WhatsAppAdapter', () => {
  it('formats message with items and total', () => {
    const adapter = new WhatsAppAdapter({
      number: '+521234567890',
      messageTemplate: 'Hola! Quiero pedir:\n{items}\nTotal: {total}',
    })
    const message = adapter.formatMessage([mockItem], 50)
    expect(message).toContain('Camiseta')
    expect(message).toContain('x2')
    expect(message).toContain('50.00')
  })

  it('builds correct wa.me URL', () => {
    const adapter = new WhatsAppAdapter({
      number: '+521234567890',
      messageTemplate: '{items}\nTotal: {total}',
    })
    const url = adapter.buildUrl([mockItem], 50)
    expect(url).toMatch(/^https:\/\/wa\.me\/521234567890/)
  })
})
