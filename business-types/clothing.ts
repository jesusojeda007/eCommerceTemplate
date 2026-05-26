import type { BusinessType } from './base'

export const clothing: BusinessType = {
  id: 'clothing',
  name: 'Ropa',
  description: 'Tienda de indumentaria con variantes de talle y color',
  variantAxes: [
    { name: 'Talle', values: ['XS', 'S', 'M', 'L', 'XL', 'XXL'] },
    { name: 'Color', values: ['#000000', '#ffffff', '#1d4ed8', '#dc2626'] },
  ],
  defaultCategories: [
    { name: 'Hombre', slug: 'hombre' },
    { name: 'Mujer', slug: 'mujer' },
    { name: 'Niños', slug: 'ninos' },
    { name: 'Accesorios', slug: 'accesorios' },
  ],
  sampleProducts: [
    {
      name: 'Remera Básica',
      slug: 'remera-basica',
      description: 'Remera de algodón 100%, corte clásico. Ideal para el día a día.',
      categorySlug: 'hombre',
      images: ['https://placehold.co/600x600?text=Remera'],
      variants: [
        { options: { Talle: 'S', Color: '#000000' }, price: 25.00, stock: 10 },
        { options: { Talle: 'M', Color: '#000000' }, price: 25.00, stock: 15 },
        { options: { Talle: 'L', Color: '#000000' }, price: 25.00, stock: 8 },
        { options: { Talle: 'XL', Color: '#000000' }, price: 25.00, stock: 0 },
        { options: { Talle: 'S', Color: '#ffffff' }, price: 25.00, stock: 12 },
        { options: { Talle: 'M', Color: '#ffffff' }, price: 25.00, stock: 10 },
        { options: { Talle: 'L', Color: '#ffffff' }, price: 25.00, stock: 5 },
        { options: { Talle: 'XL', Color: '#ffffff' }, price: 25.00, stock: 3 },
      ],
    },
    {
      name: 'Jeans Slim Fit',
      slug: 'jeans-slim-fit',
      description: 'Jeans de mezclilla premium, corte slim. Lavado oscuro.',
      categorySlug: 'hombre',
      images: ['https://placehold.co/600x600?text=Jeans'],
      variants: [
        { options: { Talle: 'S', Color: '#1d4ed8' }, price: 60.00, stock: 8 },
        { options: { Talle: 'M', Color: '#1d4ed8' }, price: 60.00, stock: 12 },
        { options: { Talle: 'L', Color: '#1d4ed8' }, price: 60.00, stock: 6 },
        { options: { Talle: 'S', Color: '#000000' }, price: 60.00, stock: 10 },
        { options: { Talle: 'M', Color: '#000000' }, price: 60.00, stock: 14 },
        { options: { Talle: 'L', Color: '#000000' }, price: 60.00, stock: 4 },
      ],
    },
    {
      name: 'Mochila Urbana',
      slug: 'mochila-urbana',
      description: 'Mochila resistente al agua con compartimento para laptop de 15".',
      categorySlug: 'accesorios',
      images: ['https://placehold.co/600x600?text=Mochila'],
      variants: [
        { options: {}, price: 45.00, compareAtPrice: 55.00, stock: 20 },
      ],
    },
  ],
  suggestedConfig: {
    tagline: 'Moda para cada ocasión',
    theme: { primary: '#111111' },
    checkout: { mode: 'whatsapp' },
  },
}
