import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import config from '../../client.config'
import { Providers } from './providers'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: config.name,
  description: config.tagline,
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es">
      <head>
        <style>{`
          :root {
            --brand-primary: ${config.theme.primary};
            --brand-bg: ${config.theme.background};
          }
        `}</style>
      </head>
      <body className={inter.className}>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
