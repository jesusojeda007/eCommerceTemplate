import { select, input, confirm } from '@inquirer/prompts'
import { businessTypes } from '../business-types'
import type { BusinessType, VariantAxis } from '../business-types'
import * as fs from 'fs'
import * as path from 'path'
import { execSync } from 'child_process'

interface WizardAnswers {
  storeName: string
  tagline: string
  brandColor: string
  whatsapp: string
  checkoutMode: 'whatsapp' | 'qr' | 'payment'
}

function generateClientConfig(answers: WizardAnswers): string {
  return `export interface ClientConfig {
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
  name: ${JSON.stringify(answers.storeName)},
  tagline: ${JSON.stringify(answers.tagline)},
  logo: '/client/logo.png',
  favicon: '/client/favicon.ico',

  theme: {
    primary: ${JSON.stringify(answers.brandColor)},
    background: '#ffffff',
    foreground: '#0a0a0a',
    // Note: font must also be updated in src/app/layout.tsx
    font: 'Inter',
  },

  whatsapp: {
    number: ${JSON.stringify(answers.whatsapp)},
    messageTemplate: 'Hola! Quiero pedir:\\n{items}\\nTotal: \${'{total}'}',
  },

  checkout: {
    mode: ${JSON.stringify(answers.checkoutMode)},
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
`
}

function generateSeed(businessTypeId: string): string {
  return `import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import bcrypt from 'bcryptjs'
import 'dotenv/config'
import { ${businessTypeId} } from '../business-types'

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! })
const prisma = new PrismaClient({ adapter })

type BT = typeof ${businessTypeId}

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
    const hasOptions = sp.variants.length > 0 && Object.keys(sp.variants[0].options).length > 0
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
                values: { create: axis.values.map((val, valIdx) => ({ value: val, position: valIdx })) },
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
            optionValueIds.length > 0 ? { connect: optionValueIds.map((id) => ({ id })) } : undefined,
        },
      })
    }
  }
}

async function main() {
  await seedFromBusinessType(${businessTypeId})

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

  console.log('✅ Seed completado')
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
`
}

async function main() {
  console.log('\n🛒 E-commerce Template — Setup Wizard\n')

  const businessTypeId = await select({
    message: 'Tipo de negocio:',
    choices: [
      ...businessTypes.map((bt) => ({ name: `${bt.name} — ${bt.description}`, value: bt.id })),
      { name: 'Otro (personalizado)', value: 'custom' },
    ],
  })

  let selectedType: BusinessType | undefined = businessTypes.find((bt) => bt.id === businessTypeId)
  let customAxes: VariantAxis[] = []
  let effectiveTypeId = businessTypeId

  if (businessTypeId === 'custom') {
    effectiveTypeId = 'clothing'
    let addingAxes = true
    while (addingAxes) {
      const axisName = await input({ message: 'Nombre del eje de variante (ej: Talle):' })
      const axisValues = await input({ message: 'Valores separados por coma (ej: S,M,L,XL):' })
      customAxes.push({
        name: axisName.trim(),
        values: axisValues.split(',').map((v) => v.trim()).filter(Boolean),
      })
      addingAxes = await confirm({ message: '¿Agregar otro eje de variante?', default: false })
    }
  }

  const storeName = await input({
    message: 'Nombre de la tienda:',
    default: selectedType?.name ?? 'Mi Tienda',
  })

  const tagline = await input({
    message: 'Tagline:',
    default: selectedType?.suggestedConfig.tagline ?? 'Bienvenido a nuestra tienda',
  })

  const brandColor = await input({
    message: 'Color principal (hex, ej: #2563eb):',
    default: selectedType?.suggestedConfig.theme?.primary ?? '#111111',
    validate: (val: string) =>
      /^#[0-9a-f]{3,6}$/i.test(val) ? true : 'Ingresá un color hex válido (ej: #ff0000)',
  })

  const whatsapp = await input({
    message: 'Número de WhatsApp (con código de país, ej: +5491112345678):',
    default: '+5491112345678',
  })

  const checkoutMode = await select<'whatsapp' | 'qr' | 'payment'>({
    message: 'Modo de checkout:',
    choices: [
      { name: 'WhatsApp', value: 'whatsapp' },
      { name: 'Código QR', value: 'qr' },
      { name: 'Pago en línea', value: 'payment' },
    ],
    default: selectedType?.suggestedConfig.checkout?.mode ?? 'whatsapp',
  })

  const configContent = generateClientConfig({ storeName, tagline, brandColor, whatsapp, checkoutMode })
  fs.writeFileSync(path.join(process.cwd(), 'client.config.ts'), configContent, 'utf-8')
  console.log('\n✅ client.config.ts generado')

  const seedContent = generateSeed(effectiveTypeId)
  fs.writeFileSync(path.join(process.cwd(), 'prisma', 'seed.ts'), seedContent, 'utf-8')
  const catCount = selectedType?.defaultCategories.length ?? customAxes.length
  const prodCount = selectedType?.sampleProducts.length ?? 0
  console.log(`✅ seed data generado (${catCount} categorías, ${prodCount} productos con variantes)`)

  const runMigrations = await confirm({
    message: '¿Correr migraciones y seed ahora?',
    default: true,
  })

  if (runMigrations) {
    console.log('\nEjecutando migraciones...')
    execSync('npx prisma migrate dev --name setup', { stdio: 'inherit' })
    console.log('Ejecutando seed...')
    execSync('npx prisma db seed', { stdio: 'inherit' })
    console.log('\n✅ Base de datos lista')
  }

  console.log('\n🎉 ¡Setup completado! Ejecutá npm run dev para iniciar.\n')
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
