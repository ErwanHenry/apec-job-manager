import Header from '@/components/Header'
import Hero from '@/components/Hero'
import Footer from '@/components/Footer'
import Chatbot from '@/components/Chatbot'
import Link from 'next/link'
import Image from 'next/image'
import { Calendar, Users, Award, BookOpen } from 'lucide-react'

export default function Home() {
  const features = [
    {
      icon: <Award className="w-8 h-8 text-nice-blue" />,
      title: "Tradition Authentique",
      description: "Recettes transmises de génération en génération, respectant l'authenticité niçoise."
    },
    {
      icon: <Users className="w-8 h-8 text-nice-blue" />,
      title: "Communauté Passionnée",
      description: "Rejoignez une communauté de passionnés qui préservent notre patrimoine culinaire."
    },
    {
      icon: <Calendar className="w-8 h-8 text-nice-blue" />,
      title: "Événements Réguliers",
      description: "Festivals, ateliers et dégustations pour célébrer ensemble notre tradition."
    },
    {
      icon: <BookOpen className="w-8 h-8 text-nice-blue" />,
      title: "Savoir & Culture",
      description: "Articles, recettes et histoires pour approfondir vos connaissances."
    }
  ]

  const recentEvents = [
    {
      date: "15 Mars 2025",
      title: "Festival du Pan Bagnat 2025",
      description: "Le grand rendez-vous annuel des amoureux du Pan Bagnat niçois.",
      image: "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=400"
    },
    {
      date: "22 Mars 2025", 
      title: "Atelier Préparation Traditionnelle",
      description: "Apprenez les secrets de la préparation authentique avec nos experts.",
      image: "https://images.unsplash.com/photo-1556909114-58d3e1b91c6b?w=400"
    },
    {
      date: "30 Mars 2025",
      title: "Dégustation Comparative",
      description: "Découvrez les subtilités gustatives des différentes préparations.",
      image: "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=400"
    }
  ]

  return (
    <main>
      <Header />
      <Hero />
      
      {/* Features Section */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Pourquoi Préserver Notre Tradition ?
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Le Pan Bagnat niçois est bien plus qu&apos;un simple sandwich. 
              C&apos;est un symbole de notre identité méditerranéenne et de notre art de vivre.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <div key={index} className="card text-center">
                <div className="flex justify-center mb-4">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                <p className="text-gray-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Events Section */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Événements à Venir
            </h2>
            <p className="text-xl text-gray-600">
              Participez à nos événements pour vivre pleinement la tradition du Pan Bagnat.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {recentEvents.map((event, index) => (
              <div key={index} className="card overflow-hidden">
                <Image
                  src={event.image}
                  alt={event.title}
                  width={400}
                  height={200}
                  className="w-full h-48 object-cover"
                />
                <div className="p-6">
                  <div className="text-nice-blue font-semibold mb-2">{event.date}</div>
                  <h3 className="text-xl font-semibold mb-2">{event.title}</h3>
                  <p className="text-gray-600 mb-4">{event.description}</p>
                  <Link href="/evenements" className="text-nice-blue hover:underline font-medium">
                    En savoir plus →
                  </Link>
                </div>
              </div>
            ))}
          </div>

          <div className="text-center mt-8">
            <Link href="/evenements" className="btn-primary">
              Voir Tous les Événements
            </Link>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-nice-blue text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold mb-4">
            Rejoignez Notre Communauté
          </h2>
          <p className="text-xl mb-8 opacity-90">
            Ensemble, préservons et partageons la tradition authentique du Pan Bagnat niçois.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/blog" className="btn-secondary">
              Découvrir le Blog
            </Link>
            <Link href="/contact" className="bg-white text-nice-blue hover:bg-gray-100 font-bold py-2 px-4 rounded transition-colors">
              Nous Contacter
            </Link>
          </div>
        </div>
      </section>

      <Footer />
      <Chatbot />
    </main>
  )
}