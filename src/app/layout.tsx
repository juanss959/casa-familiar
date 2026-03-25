import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Familia Mendoza',
  description: 'Gestión del hogar',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body suppressHydrationWarning>
        {children}
      </body>
    </html>
  )
}