import type { BusinessType } from './base'

export const food: BusinessType = {
  id: 'food',
  name: 'Comida / Nutrición',
  description: 'Tienda de alimentos y suplementos con variantes de sabor y tamaño',
  variantAxes: [
    { name: 'Sabor', values: ['Vainilla', 'Chocolate', 'Frutilla', 'Cookies'] },
    { name: 'Tamaño', values: ['500 g', '1 kg', '3 kg'] },
  ],
  defaultCategories: [
    { name: 'Proteínas', slug: 'proteinas' },
    { name: 'Snacks', slug: 'snacks' },
    { name: 'Bebidas', slug: 'bebidas' },
  ],
  sampleProducts: [
    {
      name: 'Proteína Whey Gold',
      slug: 'proteina-whey-gold',
      description: 'Proteína de suero de leche de alta pureza, 25g de proteína por porción.',
      categorySlug: 'proteinas',
      images: ['https://placehold.co/600x600?text=Whey'],
      variants: [
        { options: { Sabor: 'Chocolate', Tamaño: '500 g' }, price: 20.00, stock: 15 },
        { options: { Sabor: 'Chocolate', Tamaño: '1 kg' }, price: 35.00, stock: 10 },
        { options: { Sabor: 'Chocolate', Tamaño: '3 kg' }, price: 90.00, stock: 5 },
        { options: { Sabor: 'Vainilla', Tamaño: '500 g' }, price: 20.00, stock: 12 },
        { options: { Sabor: 'Vainilla', Tamaño: '1 kg' }, price: 35.00, stock: 8 },
        { options: { Sabor: 'Frutilla', Tamaño: '500 g' }, price: 20.00, stock: 10 },
        { options: { Sabor: 'Frutilla', Tamaño: '1 kg' }, price: 35.00, stock: 6 },
        { options: { Sabor: 'Cookies', Tamaño: '500 g' }, price: 20.00, stock: 0 },
        { options: { Sabor: 'Cookies', Tamaño: '1 kg' }, price: 35.00, stock: 0 },
      ],
    },
    {
      name: 'Barra de Proteína',
      slug: 'barra-de-proteina',
      description: 'Barra proteica sin azúcar, 20g de proteína por unidad.',
      categorySlug: 'snacks',
      images: ['https://placehold.co/600x600?text=Barra'],
      variants: [
        { options: { Sabor: 'Chocolate', Tamaño: '500 g' }, price: 15.00, stock: 20 },
        { options: { Sabor: 'Vainilla', Tamaño: '500 g' }, price: 15.00, stock: 18 },
        { options: { Sabor: 'Frutilla', Tamaño: '500 g' }, price: 15.00, stock: 10 },
      ],
    },
    {
      name: 'Pre-Workout Energy',
      slug: 'pre-workout-energy',
      description: 'Suplemento pre-entrenamiento con cafeína y beta-alanina.',
      categorySlug: 'bebidas',
      images: ['https://placehold.co/600x600?text=PreWorkout'],
      variants: [
        { options: { Sabor: 'Frutilla', Tamaño: '500 g' }, price: 28.00, stock: 8 },
        { options: { Sabor: 'Vainilla', Tamaño: '500 g' }, price: 28.00, stock: 6 },
      ],
    },
  ],
  suggestedConfig: {
    tagline: 'Nutrición de calidad para tu rendimiento',
    theme: { primary: '#16a34a' },
    checkout: { mode: 'whatsapp' },
  },
}
