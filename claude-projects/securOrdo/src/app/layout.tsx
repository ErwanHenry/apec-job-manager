import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'MUSIC - Medical Universal Secure ID Code',
  description: 'Sécurisation d\'ordonnances médicales par QR codes chiffrés autoporteurs',
  robots: 'index, follow',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr">
      <body className="bg-white font-sans text-gray-900 antialiased">
        {children}
      </body>
    </html>
  );
}
