import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import bcrypt from 'bcryptjs'
import 'dotenv/config'
import { clothing } from '../business-types'

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! })
const prisma = new PrismaClient({ adapter })

type BT = typeof clothing

async function seedFromBusinessType(bt: BT) {
  const categoryMap: Record<string, { id: string }> = {}

  for (const cat of bt.defaultCategories) {
    const created = await prisma.category.upsert({
      where: { slug: cat.slug },
      update: {},
      create: { slug: cat.slug, name: cat.name },
    })
    categoryMap[cat.slug] = created
  }

  for (const sp of bt.sampleProducts) {
    const category = categoryMap[sp.categorySlug]
    if (!category) continue

    const hasOptions =
      sp.variants.length > 0 && Object.keys(sp.variants[0].options).length > 0
    const optionAxes = bt.variantAxes.filter((axis) =>
      sp.variants.some((v) => axis.name in v.options)
    )

    const existing = await prisma.product.findUnique({ where: { slug: sp.slug } })
    if (existing) await prisma.product.delete({ where: { slug: sp.slug } })

    await prisma.product.create({
      data: {
        slug: sp.slug,
        name: sp.name,
        description: sp.description,
        images: sp.images,
        categoryId: category.id,
        options: hasOptions
          ? {
              create: optionAxes.map((axis, axisIdx) => ({
                name: axis.name,
                position: axisIdx,
                values: {
                  create: axis.values.map((val, valIdx) => ({
                    value: val,
                    position: valIdx,
                  })),
                },
              })),
            }
          : undefined,
      },
    })

    const product = await prisma.product.findUnique({
      where: { slug: sp.slug },
      include: { options: { include: { values: true } } },
    })
    if (!product) continue

    for (const sv of sp.variants) {
      const optionValueIds: string[] = []
      for (const [axisName, axisValue] of Object.entries(sv.options)) {
        const option = product.options.find((o) => o.name === axisName)
        const optionValue = option?.values.find((v) => v.value === axisValue)
        if (optionValue) optionValueIds.push(optionValue.id)
      }

      await prisma.productVariant.create({
        data: {
          productId: product.id,
          price: sv.price,
          compareAtPrice: sv.compareAtPrice ?? null,
          stock: sv.stock,
          sku: sv.sku ?? null,
          optionValues:
            optionValueIds.length > 0
              ? { connect: optionValueIds.map((id) => ({ id })) }
              : undefined,
        },
      })
    }
  }
}

async function main() {
  await seedFromBusinessType(clothing)

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
