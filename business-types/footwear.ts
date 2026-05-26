import type { BusinessType } from './base'

export const footwear: BusinessType = {
  id: 'footwear',
  name: 'Zapatería',
  description: 'Tienda de calzado con variantes de talle y color',
  variantAxes: [
    { name: 'Talle', values: ['35', '36', '37', '38', '39', '40', '41', '42', '43', '44', '45', '46'] },
    { name: 'Color', values: ['#000000', '#ffffff', '#8B4513', '#dc2626'] },
  ],
  defaultCategories: [
    { name: 'Deportivo', slug: 'deportivo' },
    { name: 'Casual', slug: 'casual' },
    { name: 'Niños', slug: 'ninos' },
  ],
  sampleProducts: [
    {
      name: 'Zapatilla Running Pro',
      slug: 'zapatilla-running-pro',
      description: 'Zapatilla de running con suela amortiguada y upper transpirable.',
      categorySlug: 'deportivo',
      images: ['https://placehold.co/600x600?text=Zapatilla'],
      variants: [
        { options: { Talle: '38', Color: '#000000' }, price: 85.00, stock: 5 },
        { options: { Talle: '39', Color: '#000000' }, price: 85.00, stock: 8 },
        { options: { Talle: '40', Color: '#000000' }, price: 85.00, stock: 10 },
        { options: { Talle: '41', Color: '#000000' }, price: 85.00, stock: 6 },
        { options: { Talle: '42', Color: '#000000' }, price: 85.00, stock: 4 },
        { options: { Talle: '38', Color: '#ffffff' }, price: 85.00, stock: 3 },
        { options: { Talle: '39', Color: '#ffffff' }, price: 85.00, stock: 7 },
        { options: { Talle: '40', Color: '#ffffff' }, price: 85.00, stock: 9 },
      ],
    },
    {
      name: 'Mocasín Cuero',
      slug: 'mocasin-cuero',
      description: 'Mocasín de cuero genuino, ideal para ocasiones formales.',
      categorySlug: 'casual',
      images: ['https://placehold.co/600x600?text=Mocasin'],
      variants: [
        { options: { Talle: '39', Color: '#8B4513' }, price: 120.00, stock: 4 },
        { options: { Talle: '40', Color: '#8B4513' }, price: 120.00, stock: 6 },
        { options: { Talle: '41', Color: '#8B4513' }, price: 120.00, stock: 5 },
        { options: { Talle: '42', Color: '#8B4513' }, price: 120.00, stock: 3 },
        { options: { Talle: '39', Color: '#000000' }, price: 120.00, stock: 8 },
        { options: { Talle: '40', Color: '#000000' }, price: 120.00, stock: 10 },
      ],
    },
    {
      name: 'Bota de Lluvia',
      slug: 'bota-lluvia',
      description: 'Bota impermeable de goma, perfecta para días lluviosos.',
      categorySlug: 'casual',
      images: ['https://placehold.co/600x600?text=Bota'],
      variants: [
        { options: { Talle: '37', Color: '#000000' }, price: 55.00, stock: 5 },
        { options: { Talle: '38', Color: '#000000' }, price: 55.00, stock: 8 },
        { options: { Talle: '39', Color: '#000000' }, price: 55.00, stock: 10 },
        { options: { Talle: '37', Color: '#dc2626' }, price: 55.00, stock: 3 },
        { options: { Talle: '38', Color: '#dc2626' }, price: 55.00, stock: 6 },
      ],
    },
  ],
  suggestedConfig: {
    tagline: 'El calzado que te lleva lejos',
    theme: { primary: '#8B4513' },
    checkout: { mode: 'whatsapp' },
  },
}
