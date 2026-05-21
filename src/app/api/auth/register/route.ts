import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { findUserByEmail, createUser } from '@/lib/data/users'

export async function POST(req: Request) {
  const { name, email, password } = await req.json()

  if (!name || !email || !password) {
    return NextResponse.json({ error: 'Todos los campos son requeridos' }, { status: 400 })
  }

  if (password.length < 8) {
    return NextResponse.json({ error: 'La contraseña debe tener al menos 8 caracteres' }, { status: 400 })
  }

  const existing = await findUserByEmail(email)
  if (existing) {
    return NextResponse.json({ error: 'El email ya está registrado' }, { status: 409 })
  }

  const hash = await bcrypt.hash(password, 10)
  await createUser(name, email, hash)

  return NextResponse.json({ ok: true }, { status: 201 })
}
