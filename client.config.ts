export interface ClientConfig {
  name: string
  tagline: string
  logo: string
  favicon: string
  theme: {
    primary: string
    background: string
    foreground: string
    font: string
  }
  whatsapp: {
    number: string
    messageTemplate: string
  }
  checkout: {
    mode: 'whatsapp' | 'qr' | 'payment'
    qr?: {
      imageUrl: string
      instructions: string
    }
  }
  discounts: {
    couponsEnabled: boolean
    volumeDiscountsEnabled: boolean
  }
  features: {
    auth: boolean
    wishlist: boolean
    reviews: boolean
    searchBar: boolean
  }
}

const config: ClientConfig = {
  name: 'Mi Tienda',
  tagline: 'Los mejores productos',
  logo: '/client/logo.png',
  favicon: '/client/favicon.ico',

  theme: {
    primary: '#16a34a',
    background: '#ffffff',
    foreground: '#0a0a0a',
    // Note: font must also be updated in src/app/layout.tsx (Next.js font optimization
    // requires static string literals and cannot be driven by runtime config).
    font: 'Inter',
  },

  whatsapp: {
    number: '+521234567890',
    messageTemplate: 'Hola! Quiero pedir:\n{items}\nTotal: {total}',
  },

  checkout: {
    mode: 'whatsapp',
    qr: {
      imageUrl: '/client/qr-pago.png',
      instructions: 'Escanea el QR y envía el comprobante por WhatsApp',
    },
  },

  discounts: {
    couponsEnabled: true,
    volumeDiscountsEnabled: true,
  },

  features: {
    auth: true,
    wishlist: false,
    reviews: false,
    searchBar: true,
  },
}

export default config
