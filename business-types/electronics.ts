import type { BusinessType } from './base'

export const electronics: BusinessType = {
  id: 'electronics',
  name: 'Electrónica',
  description: 'Tienda de electrónica con variantes de color y garantía',
  variantAxes: [
    { name: 'Color', values: ['Negro', 'Blanco', 'Azul'] },
    { name: 'Garantía', values: ['1 año', '2 años'] },
  ],
  defaultCategories: [
    { name: 'Audio', slug: 'audio' },
    { name: 'Móviles', slug: 'moviles' },
    { name: 'Computación', slug: 'computacion' },
  ],
  sampleProducts: [
    {
      name: 'Auriculares BT Pro',
      slug: 'auriculares-bt-pro',
      description: 'Auriculares inalámbricos con cancelación de ruido y 30h de batería.',
      categorySlug: 'audio',
      images: ['https://placehold.co/600x600?text=Auriculares'],
      variants: [
        { options: { Color: 'Negro', Garantía: '1 año' }, price: 89.00, compareAtPrice: 120.00, stock: 10 },
        { options: { Color: 'Negro', Garantía: '2 años' }, price: 104.00, compareAtPrice: 120.00, stock: 8 },
        { options: { Color: 'Blanco', Garantía: '1 año' }, price: 89.00, compareAtPrice: 120.00, stock: 6 },
        { options: { Color: 'Blanco', Garantía: '2 años' }, price: 104.00, compareAtPrice: 120.00, stock: 4 },
        { options: { Color: 'Azul', Garantía: '1 año' }, price: 89.00, compareAtPrice: 120.00, stock: 0 },
      ],
    },
    {
      name: 'Parlante Portátil',
      slug: 'parlante-portatil',
      description: 'Parlante Bluetooth resistente al agua, 10h de reproducción.',
      categorySlug: 'audio',
      images: ['https://placehold.co/600x600?text=Parlante'],
      variants: [
        { options: { Color: 'Negro', Garantía: '1 año' }, price: 45.00, stock: 15 },
        { options: { Color: 'Negro', Garantía: '2 años' }, price: 60.00, stock: 8 },
        { options: { Color: 'Azul', Garantía: '1 año' }, price: 45.00, stock: 12 },
        { options: { Color: 'Azul', Garantía: '2 años' }, price: 60.00, stock: 5 },
      ],
    },
    {
      name: 'Teclado Mecánico',
      slug: 'teclado-mecanico',
      description: 'Teclado mecánico compacto, switches Cherry MX Blue.',
      categorySlug: 'computacion',
      images: ['https://placehold.co/600x600?text=Teclado'],
      variants: [
        { options: { Color: 'Negro', Garantía: '1 año' }, price: 75.00, stock: 8 },
        { options: { Color: 'Blanco', Garantía: '1 año' }, price: 75.00, stock: 5 },
        { options: { Color: 'Negro', Garantía: '2 años' }, price: 90.00, stock: 4 },
      ],
    },
  ],
  suggestedConfig: {
    tagline: 'Tecnología que transforma tu día',
    theme: { primary: '#2563eb' },
    checkout: { mode: 'whatsapp' },
  },
}
