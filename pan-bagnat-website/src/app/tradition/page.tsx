import Header from '@/components/Header'
import Footer from '@/components/Footer'
import Chatbot from '@/components/Chatbot'
import Image from 'next/image'
import { CheckCircle, Star, Clock, Users } from 'lucide-react'

export default function TraditionPage() {
  const ingredients = [
    { name: 'Pain de campagne rond', description: 'Pain traditionnel niçois, de préférence de la veille' },
    { name: 'Tomates bien mûres', description: 'Tomates gorgées de soleil méditerranéen' },
    { name: 'Anchois de Méditerranée', description: 'Filets d\'anchois au sel, tradition locale' },
    { name: 'Olives noires de Nice', description: 'Olives Cailletier, spécialité de la région' },
    { name: 'Œufs durs', description: 'Œufs frais cuits dur, coupés en rondelles' },
    { name: 'Poivrons', description: 'Poivrons rouges ou verts, selon la saison' },
    { name: 'Radis', description: 'Radis roses, pour le croquant et la fraîcheur' },
    { name: 'Basilic frais', description: 'Basilic du jardin, parfum méditerranéen' },
    { name: 'Huile d\'olive extra vierge', description: 'Huile d\'olive de première pression' }
  ]

  const steps = [
    {
      title: 'Préparation du pain',
      description: 'Couper le pain en deux horizontalement. Retirer légèrement la mie pour faire de la place aux garnitures.',
      time: '5 min'
    },
    {
      title: 'Assaisonnement',
      description: 'Frotter l\'intérieur du pain avec une gousse d\'ail et arroser généreusement d\'huile d\'olive.',
      time: '2 min'
    },
    {
      title: 'Garniture des légumes',
      description: 'Disposer les tomates coupées, les œufs durs, les poivrons, les radis et le basilic.',
      time: '10 min'
    },
    {
      title: 'Anchois et olives',
      description: 'Ajouter les filets d\'anchois et les olives noires. Saler et poivrer selon le goût.',
      time: '3 min'
    },
    {
      title: 'Finition',
      description: 'Refermer le pain, envelopper dans du papier et laisser reposer 1h minimum pour que les saveurs se mélangent.',
      time: '60 min'
    }
  ]

  const tips = [
    'Utilisez toujours des produits frais et de saison',
    'Le pain doit être légèrement rassis pour mieux absorber les saveurs',
    'L\'huile d\'olive est essentielle : ne lésinez pas sur la qualité',
    'Laissez reposer le Pan Bagnat : c\'est le secret de son goût authentique',
    'Chaque famille niçoise a ses petits secrets : n\'hésitez pas à personnaliser'
  ]

  return (
    <main>
      <Header />
      
      {/* Hero Section */}
      <section className="relative bg-gradient-to-r from-nice-blue to-mediterranean text-white py-20">
        <div className="absolute inset-0 bg-black opacity-20"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-6">
              La Tradition du Pan Bagnat
            </h1>
            <p className="text-xl md:text-2xl opacity-90 max-w-3xl mx-auto">
              Découvrez l&apos;art ancestral de préparer le véritable Pan Bagnat niçois, 
              transmis de génération en génération depuis le 19ème siècle.
            </p>
          </div>
        </div>
      </section>

      {/* Histoire */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-6">
                Une Histoire Authentique
              </h2>
              <div className="space-y-4 text-gray-600">
                <p>
                  Le Pan Bagnat, littéralement &quot;pain mouillé&quot; en niçois, trouve ses origines 
                  au 19ème siècle dans les rues de Nice. Ce sandwich était le repas quotidien 
                  des travailleurs, pêcheurs et ouvriers qui avaient besoin d&apos;un repas 
                  nutritif et pratique.
                </p>
                <p>
                  Né de la nécessité d&apos;utiliser le pain de la veille et les légumes du jardin, 
                  le Pan Bagnat incarne l&apos;esprit méditerranéen : simplicité, fraîcheur et 
                  respect des produits locaux.
                </p>
                <p>
                  Aujourd&apos;hui, il reste le symbole de l&apos;art de vivre niçois et de notre 
                  patrimoine culinaire, préservé jalousement par les familles et les 
                  artisans locaux.
                </p>
              </div>
            </div>
            <div>
              <Image
                src="https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=600"
                alt="Histoire du Pan Bagnat"
                width={600}
                height={400}
                className="rounded-lg shadow-lg"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Ingrédients */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Les Ingrédients Authentiques
            </h2>
            <p className="text-xl text-gray-600">
              Chaque ingrédient a sa raison d&apos;être dans la composition traditionnelle du Pan Bagnat.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {ingredients.map((ingredient, index) => (
              <div key={index} className="card">
                <div className="flex items-start">
                  <CheckCircle className="w-6 h-6 text-green-500 mr-3 mt-1 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">
                      {ingredient.name}
                    </h3>
                    <p className="text-gray-600 text-sm">
                      {ingredient.description}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Préparation */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              La Préparation Traditionnelle
            </h2>
            <p className="text-xl text-gray-600">
              Suivez ces étapes pour préparer un Pan Bagnat authentique.
            </p>
          </div>

          <div className="max-w-4xl mx-auto">
            {steps.map((step, index) => (
              <div key={index} className="flex items-start mb-8">
                <div className="flex-shrink-0 w-12 h-12 bg-nice-blue text-white rounded-full flex items-center justify-center font-bold text-lg mr-6">
                  {index + 1}
                </div>
                <div className="flex-1">
                  <div className="flex items-center mb-2">
                    <h3 className="text-xl font-semibold text-gray-900 mr-4">
                      {step.title}
                    </h3>
                    <div className="flex items-center text-sm text-gray-500">
                      <Clock className="w-4 h-4 mr-1" />
                      {step.time}
                    </div>
                  </div>
                  <p className="text-gray-600">
                    {step.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Conseils */}
      <section className="py-16 bg-nice-blue text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">
              Les Secrets des Maîtres
            </h2>
            <p className="text-xl opacity-90">
              Conseils traditionnels pour un Pan Bagnat parfait.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {tips.map((tip, index) => (
              <div key={index} className="bg-white bg-opacity-10 rounded-lg p-6">
                <div className="flex items-start">
                  <Star className="w-6 h-6 text-nice-yellow mr-3 mt-1 flex-shrink-0" />
                  <p className="text-white">
                    {tip}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Prêt à Préparer Votre Pan Bagnat ?
          </h2>
          <p className="text-xl text-gray-600 mb-8">
            Rejoignez nos ateliers de préparation pour apprendre directement 
            auprès de nos maîtres artisans.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a href="/evenements" className="btn-primary">
              Voir les Ateliers
            </a>
            <a href="/blog" className="btn-secondary">
              Lire nos Articles
            </a>
          </div>
        </div>
      </section>

      <Footer />
      <Chatbot />
    </main>
  )
}