import type { Metadata } from 'next'
import { Inter, Georgia } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Pan Bagnat Niçois - Tradition & Authenticité',
  description: 'Découvrez les valeurs authentiques du Pan Bagnat Niçois, sandwich traditionnel de Nice. Événements, recettes traditionnelles et culture niçoise.',
  keywords: 'pan bagnat, nice, niçois, tradition, sandwich, méditerranéen, culture, gastronomie',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="fr">
      <body className={inter.className}>{children}</body>
    </html>
  )
}