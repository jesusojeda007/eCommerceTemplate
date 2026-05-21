import { prisma } from '@/lib/db'

export async function findUserByEmail(email: string) {
  return prisma.user.findUnique({ where: { email } })
}

export async function createUser(name: string, email: string, hashedPassword: string) {
  return prisma.user.create({
    data: { name, email, password: hashedPassword },
  })
}
