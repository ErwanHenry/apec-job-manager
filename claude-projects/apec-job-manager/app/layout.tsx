import type { Metadata } from 'next'
import './globals.css'
import { Providers } from '@/components/Providers'

export const metadata: Metadata = {
  title: 'APEC Job Manager - Gestion d\'annonces APEC',
  description: 'Outil d\'automatisation pour la gestion d\'annonces APEC.FR',
  keywords: ['APEC', 'Job Manager', 'Recruitment', 'Automation'],
  authors: [{ name: 'APEC Job Manager Team' }],
  openGraph: {
    title: 'APEC Job Manager',
    description: 'Outil d\'automatisation pour la gestion d\'annonces APEC.FR',
    type: 'website',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="fr" className="h-full">
      <body className="h-full bg-gray-50 font-sans">
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
