import Link from 'next/link'
import { Facebook, Instagram, Twitter } from 'lucide-react'

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-white">
      <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="col-span-1 md:col-span-2">
            <h3 className="text-2xl font-bold text-nice-yellow mb-4">Pan Bagnat Niçois</h3>
            <p className="text-gray-300 mb-4">
              Préservons ensemble l&apos;authenticité du Pan Bagnat Niçois, 
              symbole de notre patrimoine culinaire méditerranéen.
            </p>
            <div className="flex space-x-4">
              <a href="#" className="text-gray-300 hover:text-nice-yellow transition-colors">
                <Facebook size={24} />
              </a>
              <a href="#" className="text-gray-300 hover:text-nice-yellow transition-colors">
                <Instagram size={24} />
              </a>
              <a href="#" className="text-gray-300 hover:text-nice-yellow transition-colors">
                <Twitter size={24} />
              </a>
            </div>
          </div>

          <div>
            <h4 className="text-lg font-semibold mb-4">Navigation</h4>
            <ul className="space-y-2">
              <li><Link href="/" className="text-gray-300 hover:text-white transition-colors">Accueil</Link></li>
              <li><Link href="/tradition" className="text-gray-300 hover:text-white transition-colors">Tradition</Link></li>
              <li><Link href="/evenements" className="text-gray-300 hover:text-white transition-colors">Événements</Link></li>
              <li><Link href="/blog" className="text-gray-300 hover:text-white transition-colors">Blog</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-lg font-semibold mb-4">Contact</h4>
            <p className="text-gray-300 mb-2">Nice, Côte d&apos;Azur</p>
            <p className="text-gray-300 mb-2">France</p>
            <p className="text-gray-300">contact@panbagnatnipois.com</p>
          </div>
        </div>

        <div className="mt-8 pt-8 border-t border-gray-800 text-center">
          <p className="text-gray-300">
            © 2025 Pan Bagnat Niçois. Tous droits réservés. 
            Fait avec ❤️ pour préserver notre patrimoine culinaire.
          </p>
        </div>
      </div>
    </footer>
  )
}