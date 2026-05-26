import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import bcrypt from 'bcryptjs'
import 'dotenv/config'

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! })
const prisma = new PrismaClient({ adapter })

async function main() {
  // Categories
  const ropa = await prisma.category.upsert({
    where: { slug: 'ropa' },
    update: {},
    create: { slug: 'ropa', name: 'Ropa' },
  })
  const accesorios = await prisma.category.upsert({
    where: { slug: 'accesorios' },
    update: {},
    create: { slug: 'accesorios', name: 'Accesorios' },
  })
  const electronica = await prisma.category.upsert({
    where: { slug: 'electronica' },
    update: {},
    create: { slug: 'electronica', name: 'Electrónica' },
  })

  // Products — each product now has variants instead of top-level price/stock
  await prisma.product.upsert({
    where: { slug: 'camiseta-blanca' },
    update: {},
    create: {
      slug: 'camiseta-blanca',
      name: 'Camiseta Blanca',
      description: 'Camiseta de algodón 100%, corte clásico. Ideal para el día a día.',
      images: ['https://placehold.co/600x600?text=Camiseta'],
      categoryId: ropa.id,
      volumeDiscounts: {
        create: [
          { minQty: 3, type: 'percent', value: 10 },
          { minQty: 5, type: 'percent', value: 20 },
        ],
      },
      variants: {
        create: [{ price: 25.00, compareAtPrice: 35.00, stock: 50 }],
      },
    },
  })

  await prisma.product.upsert({
    where: { slug: 'jeans-slim' },
    update: {},
    create: {
      slug: 'jeans-slim',
      name: 'Jeans Slim Fit',
      description: 'Jeans de mezclilla premium, corte slim. Disponible en varios talles.',
      images: ['https://placehold.co/600x600?text=Jeans'],
      categoryId: ropa.id,
      variants: {
        create: [{ price: 60.00, stock: 30 }],
      },
    },
  })

  await prisma.product.upsert({
    where: { slug: 'mochila-urbana' },
    update: {},
    create: {
      slug: 'mochila-urbana',
      name: 'Mochila Urbana',
      description: 'Mochila resistente al agua con compartimento para laptop de 15".',
      images: ['https://placehold.co/600x600?text=Mochila'],
      categoryId: accesorios.id,
      variants: {
        create: [{ price: 45.00, compareAtPrice: 55.00, stock: 20 }],
      },
    },
  })

  await prisma.product.upsert({
    where: { slug: 'auriculares-bt' },
    update: {},
    create: {
      slug: 'auriculares-bt',
      name: 'Auriculares Bluetooth',
      description: 'Auriculares inalámbricos con cancelación de ruido y 20h de batería.',
      images: ['https://placehold.co/600x600?text=Auriculares'],
      categoryId: electronica.id,
      volumeDiscounts: {
        create: [{ minQty: 2, type: 'fixed', value: 10 }],
      },
      variants: {
        create: [{ price: 89.00, compareAtPrice: 120.00, stock: 15 }],
      },
    },
  })

  await prisma.product.upsert({
    where: { slug: 'reloj-minimalista' },
    update: {},
    create: {
      slug: 'reloj-minimalista',
      name: 'Reloj Minimalista',
      description: 'Reloj de pulsera de diseño minimalista, correa de cuero genuino.',
      images: ['https://placehold.co/600x600?text=Reloj'],
      categoryId: accesorios.id,
      variants: {
        create: [{ price: 75.00, stock: 10 }],
      },
    },
  })

  // Coupons
  await prisma.coupon.upsert({
    where: { code: 'VERANO20' },
    update: {},
    create: { code: 'VERANO20', type: 'percent', value: 20, active: true },
  })
  await prisma.coupon.upsert({
    where: { code: 'DESCUENTO10' },
    update: {},
    create: { code: 'DESCUENTO10', type: 'fixed', value: 10, minOrderAmount: 50, active: true },
  })

  // Demo user (password: "password123")
  const hash = await bcrypt.hash('password123', 10)
  await prisma.user.upsert({
    where: { email: 'demo@example.com' },
    update: {},
    create: { email: 'demo@example.com', name: 'Usuario Demo', password: hash },
  })

  console.log('✅ Seed completed')
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
