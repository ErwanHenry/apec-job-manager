import Link from 'next/link'
import Image from 'next/image'

export default function Hero() {
  return (
    <section className="relative bg-gradient-to-r from-mediterranean to-nice-blue text-white">
      <div className="absolute inset-0 bg-black opacity-20"></div>
      <div className="relative max-w-7xl mx-auto py-24 px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div>
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              Pan Bagnat
              <span className="block text-nice-yellow">Niçois</span>
            </h1>
            <p className="text-xl md:text-2xl mb-8 opacity-90">
              L&apos;authenticité méditerranéenne dans chaque bouchée. 
              Découvrez la tradition culinaire de Nice.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link href="/tradition" className="btn-primary text-center">
                Découvrir la Tradition
              </Link>
              <Link href="/evenements" className="btn-secondary text-center">
                Nos Événements
              </Link>
            </div>
          </div>
          <div className="relative">
            <div className="bg-white rounded-lg shadow-2xl overflow-hidden">
              <Image
                src="https://images.unsplash.com/photo-1539252554453-80ab65ce3586?w=600"
                alt="Pan Bagnat traditionnel niçois"
                width={600}
                height={400}
                className="w-full h-80 object-cover"
                priority
              />
              <div className="p-6 bg-white">
                <h3 className="text-gray-900 text-xl font-semibold mb-2">
                  Un sandwich d&apos;exception
                </h3>
                <p className="text-gray-600">
                  Tomates, anchois, olives, œufs durs, poivrons... 
                  Les saveurs authentiques de la Méditerranée.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}