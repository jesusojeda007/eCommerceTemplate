import { WhatsAppAdapter } from '@/lib/checkout/whatsapp'
import type { CartItem } from '@/lib/data/types'

const mockItem: CartItem = {
  product: {
    id: 'p1',
    slug: 'test-product',
    name: 'Test Product',
    description: 'A test product',
    images: ['/test.jpg'],
    categoryId: 'c1',
    category: { id: 'c1', slug: 'cat', name: 'Category' },
    volumeDiscounts: [],
    options: [],
    variants: [],
  },
  variant: {
    id: 'var1',
    productId: 'p1',
    sku: null,
    price: 25,
    compareAtPrice: null,
    stock: 10,
    optionValues: [],
  },
  variantLabel: 'Default',
  quantity: 2,
  unitPrice: 25,
  basePrice: 25,
}

describe('WhatsAppAdapter', () => {
  it('formats message with items and total', () => {
    const adapter = new WhatsAppAdapter({
      number: '+521234567890',
      messageTemplate: 'Hola! Quiero pedir:\n{items}\nTotal: {total}',
    })
    const message = adapter.formatMessage([mockItem], 50)
    expect(message).toContain('Test Product')
    expect(message).toContain('x2')
    expect(message).toContain('50.00')
  })

  it('does not include variant label when it is Default', () => {
    const adapter = new WhatsAppAdapter({
      number: '+521234567890',
      messageTemplate: '{items}\nTotal: {total}',
    })
    const message = adapter.formatMessage([mockItem], 50)
    expect(message).not.toContain('(Default)')
  })

  it('includes variant label when not Default', () => {
    const adapter = new WhatsAppAdapter({
      number: '+521234567890',
      messageTemplate: '{items}\nTotal: {total}',
    })
    const itemWithVariant = { ...mockItem, variantLabel: 'Talle: M / Color: Negro' }
    const msg = adapter.formatMessage([itemWithVariant], 25)
    expect(msg).toContain('(Talle: M / Color: Negro)')
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
