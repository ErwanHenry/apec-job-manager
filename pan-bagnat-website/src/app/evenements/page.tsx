'use client'

import { useState } from 'react'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import Chatbot from '@/components/Chatbot'
import { Calendar, MapPin, Clock, Users } from 'lucide-react'

interface Event {
  id: string
  title: string
  date: string
  time: string
  location: string
  description: string
  category: 'festival' | 'atelier' | 'degustation' | 'conference'
  participants: number
  maxParticipants?: number
}

export default function EvenementsPage() {
  const [selectedCategory, setSelectedCategory] = useState<string>('all')

  const events: Event[] = [
    {
      id: '1',
      title: 'Festival du Pan Bagnat 2025',
      date: '2025-03-15',
      time: '10:00 - 18:00',
      location: 'Place Masséna, Nice',
      description: 'Le grand rendez-vous annuel des amoureux du Pan Bagnat niçois. Venez découvrir les meilleures préparations, rencontrer les artisans locaux et participer aux concours.',
      category: 'festival',
      participants: 245,
      maxParticipants: 500
    },
    {
      id: '2',
      title: 'Atelier Préparation Traditionnelle',
      date: '2025-03-22',
      time: '14:00 - 17:00',
      location: 'École Culinaire de Nice',
      description: 'Apprenez les secrets de la préparation authentique avec nos maîtres. Techniques traditionnelles, choix des ingrédients et astuces de conservation.',
      category: 'atelier',
      participants: 18,
      maxParticipants: 20
    },
    {
      id: '3',
      title: 'Dégustation Comparative',
      date: '2025-03-30',
      time: '16:00 - 19:00',
      location: 'Marché aux Fleurs, Cours Saleya',
      description: 'Découvrez les subtilités gustatives des différentes préparations régionales. Une exploration sensorielle unique guidée par des experts.',
      category: 'degustation',
      participants: 32,
      maxParticipants: 40
    },
    {
      id: '4',
      title: 'Conférence : Histoire du Pan Bagnat',
      date: '2025-04-05',
      time: '18:30 - 20:00',
      location: 'Bibliothèque Louis Nucéra',
      description: 'Plongez dans l\'histoire fascinante du Pan Bagnat niçois. Des origines populaires aux évolutions contemporaines.',
      category: 'conference',
      participants: 56,
      maxParticipants: 80
    },
    {
      id: '5',
      title: 'Atelier Enfants : Mon Premier Pan Bagnat',
      date: '2025-04-12',
      time: '10:00 - 12:00',
      location: 'Centre Culturel Niçois',
      description: 'Initiation ludique pour les enfants de 6 à 12 ans. Découverte des ingrédients et préparation d\'un vrai Pan Bagnat.',
      category: 'atelier',
      participants: 12,
      maxParticipants: 15
    },
    {
      id: '6',
      title: 'Festival Gastronomique de Printemps',
      date: '2025-04-20',
      time: '11:00 - 20:00',
      location: 'Promenade des Anglais',
      description: 'Célébration de la gastronomie niçoise avec le Pan Bagnat en vedette. Stands, démonstrations et animations pour toute la famille.',
      category: 'festival',
      participants: 180,
      maxParticipants: 300
    }
  ]

  const categories = [
    { value: 'all', label: 'Tous les événements' },
    { value: 'festival', label: 'Festivals' },
    { value: 'atelier', label: 'Ateliers' },
    { value: 'degustation', label: 'Dégustations' },
    { value: 'conference', label: 'Conférences' }
  ]

  const filteredEvents = selectedCategory === 'all' 
    ? events 
    : events.filter(event => event.category === selectedCategory)

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('fr-FR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'festival': return 'bg-purple-100 text-purple-800'
      case 'atelier': return 'bg-green-100 text-green-800'
      case 'degustation': return 'bg-orange-100 text-orange-800'
      case 'conference': return 'bg-blue-100 text-blue-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <main>
      <Header />
      
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-nice-blue to-mediterranean text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl font-bold mb-4">Événements Pan Bagnat</h1>
            <p className="text-xl opacity-90 max-w-3xl mx-auto">
              Participez à nos événements pour découvrir, apprendre et célébrer 
              la tradition authentique du Pan Bagnat niçois.
            </p>
          </div>
        </div>
      </section>

      {/* Calendar Section */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Filter */}
          <div className="mb-8">
            <div className="flex flex-wrap gap-2">
              {categories.map((category) => (
                <button
                  key={category.value}
                  onClick={() => setSelectedCategory(category.value)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                    selectedCategory === category.value
                      ? 'bg-nice-blue text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  {category.label}
                </button>
              ))}
            </div>
          </div>

          {/* Events Grid */}
          <div className="space-y-6">
            {filteredEvents.map((event) => (
              <div key={event.id} className="card hover:shadow-lg transition-shadow">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-4 mb-3">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${getCategoryColor(event.category)}`}>
                        {event.category.charAt(0).toUpperCase() + event.category.slice(1)}
                      </span>
                      {event.maxParticipants && (
                        <div className="flex items-center text-sm text-gray-600">
                          <Users className="w-4 h-4 mr-1" />
                          {event.participants}/{event.maxParticipants}
                        </div>
                      )}
                    </div>
                    
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">
                      {event.title}
                    </h3>
                    
                    <p className="text-gray-600 mb-4">
                      {event.description}
                    </p>
                    
                    <div className="flex flex-wrap gap-4 text-sm text-gray-500">
                      <div className="flex items-center">
                        <Calendar className="w-4 h-4 mr-2" />
                        {formatDate(event.date)}
                      </div>
                      <div className="flex items-center">
                        <Clock className="w-4 h-4 mr-2" />
                        {event.time}
                      </div>
                      <div className="flex items-center">
                        <MapPin className="w-4 h-4 mr-2" />
                        {event.location}
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-4 lg:mt-0 lg:ml-6">
                    <button 
                      className={`btn-primary w-full lg:w-auto ${
                        !!event.maxParticipants && event.participants >= event.maxParticipants
                          ? 'opacity-50 cursor-not-allowed'
                          : ''
                      }`}
                      disabled={!!event.maxParticipants && event.participants >= event.maxParticipants}
                    >
                      {!!event.maxParticipants && event.participants >= event.maxParticipants
                        ? 'Complet'
                        : 'S\'inscrire'
                      }
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {filteredEvents.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-500 text-lg">
                Aucun événement trouvé pour cette catégorie.
              </p>
            </div>
          )}
        </div>
      </section>

      {/* Newsletter CTA */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Ne Ratez Aucun Événement
          </h2>
          <p className="text-xl text-gray-600 mb-8">
            Inscrivez-vous à notre newsletter pour être informé en avant-première 
            de tous nos événements et actualités.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
            <input
              type="email"
              placeholder="Votre adresse email"
              className="flex-1 px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-nice-blue"
            />
            <button className="btn-primary whitespace-nowrap">
              S&apos;abonner
            </button>
          </div>
        </div>
      </section>

      <Footer />
      <Chatbot />
    </main>
  )
}