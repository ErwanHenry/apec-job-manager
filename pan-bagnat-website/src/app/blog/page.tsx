'use client'

import { useState } from 'react'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import Chatbot from '@/components/Chatbot'
import Link from 'next/link'
import Image from 'next/image'
import { Calendar, User, Tag } from 'lucide-react'

interface BlogPost {
  id: string
  title: string
  excerpt: string
  content: string
  author: string
  date: string
  category: string
  image: string
  tags: string[]
}

export default function BlogPage() {
  const [selectedCategory, setSelectedCategory] = useState<string>('all')

  const blogPosts: BlogPost[] = [
    {
      id: '1',
      title: 'Les Secrets d\'un Pan Bagnat Authentique',
      excerpt: 'Découvrez les techniques traditionnelles pour préparer le parfait Pan Bagnat niçois, avec les conseils de nos maîtres artisans.',
      content: 'Le Pan Bagnat authentique nécessite une attention particulière à chaque détail...',
      author: 'Marie Dubois',
      date: '2025-03-10',
      category: 'tradition',
      image: 'https://images.unsplash.com/photo-1539252554453-80ab65ce3586?w=600',
      tags: ['tradition', 'recette', 'technique']
    },
    {
      id: '2',
      title: 'L\'Histoire du Pan Bagnat à Travers les Siècles',
      excerpt: 'Un voyage dans le temps pour comprendre l\'évolution de notre sandwich emblématique depuis ses origines populaires.',
      content: 'Au 19ème siècle, le Pan Bagnat était le repas des travailleurs...',
      author: 'Jean-Pierre Martineau',
      date: '2025-03-08',
      category: 'histoire',
      image: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=600',
      tags: ['histoire', 'culture', 'nice']
    },
    {
      id: '3',
      title: 'Choisir les Meilleurs Ingrédients',
      excerpt: 'Guide complet pour sélectionner les ingrédients de qualité qui feront la différence dans votre Pan Bagnat.',
      content: 'La qualité des ingrédients est primordiale pour un Pan Bagnat réussi...',
      author: 'Sophie Verdier',
      date: '2025-03-05',
      category: 'ingredients',
      image: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=600',
      tags: ['ingrédients', 'qualité', 'conseils']
    },
    {
      id: '4',
      title: 'Festival Pan Bagnat 2025 : Retour en Images',
      excerpt: 'Revivez les moments forts de notre dernier festival avec photos et témoignages des participants.',
      content: 'Le festival 2025 a été un succès remarquable avec plus de 500 participants...',
      author: 'Lucas Moreau',
      date: '2025-03-16',
      category: 'événements',
      image: 'https://images.unsplash.com/photo-1556909114-58d3e1b91c6b?w=600',
      tags: ['festival', 'événement', 'communauté']
    },
    {
      id: '5',
      title: 'Pan Bagnat et Nutrition : Un Équilibre Parfait',
      excerpt: 'Analyse nutritionnelle du Pan Bagnat traditionnel et ses bienfaits pour une alimentation équilibrée.',
      content: 'Le Pan Bagnat offre un excellent équilibre nutritionnel...',
      author: 'Dr. Amélie Rossi',
      date: '2025-03-12',
      category: 'nutrition',
      image: 'https://images.unsplash.com/photo-1498837167922-ddd27525d352?w=600',
      tags: ['nutrition', 'santé', 'alimentation']
    },
    {
      id: '6',
      title: 'Variations Saisonnières du Pan Bagnat',
      excerpt: 'Comment adapter votre Pan Bagnat selon les saisons pour profiter des meilleurs produits locaux.',
      content: 'Chaque saison apporte ses propres saveurs au Pan Bagnat...',
      author: 'Pierre Blanchard',
      date: '2025-03-14',
      category: 'saisons',
      image: 'https://images.unsplash.com/photo-1490818387583-1baba5e638af?w=600',
      tags: ['saisons', 'produits locaux', 'variations']
    }
  ]

  const categories = [
    { value: 'all', label: 'Tous les articles' },
    { value: 'tradition', label: 'Tradition' },
    { value: 'histoire', label: 'Histoire' },
    { value: 'ingredients', label: 'Ingrédients' },
    { value: 'événements', label: 'Événements' },
    { value: 'nutrition', label: 'Nutrition' },
    { value: 'saisons', label: 'Saisons' }
  ]

  const filteredPosts = selectedCategory === 'all' 
    ? blogPosts 
    : blogPosts.filter(post => post.category === selectedCategory)

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  return (
    <main>
      <Header />
      
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-nice-blue to-mediterranean text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl font-bold mb-4">Blog Pan Bagnat</h1>
            <p className="text-xl opacity-90 max-w-3xl mx-auto">
              Découvrez nos articles sur la tradition, l&apos;histoire et les secrets 
              du Pan Bagnat niçois authentique.
            </p>
          </div>
        </div>
      </section>

      {/* Blog Section */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Category Filter */}
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

          {/* Featured Post */}
          {filteredPosts.length > 0 && (
            <div className="mb-12">
              <div className="card overflow-hidden lg:flex">
                <div className="lg:w-1/2">
                  <Image
                    src={filteredPosts[0].image}
                    alt={filteredPosts[0].title}
                    width={600}
                    height={400}
                    className="w-full h-64 lg:h-full object-cover"
                  />
                </div>
                <div className="lg:w-1/2 p-8">
                  <div className="flex items-center gap-4 mb-4 text-sm text-gray-500">
                    <div className="flex items-center">
                      <Calendar className="w-4 h-4 mr-1" />
                      {formatDate(filteredPosts[0].date)}
                    </div>
                    <div className="flex items-center">
                      <User className="w-4 h-4 mr-1" />
                      {filteredPosts[0].author}
                    </div>
                  </div>
                  
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">
                    {filteredPosts[0].title}
                  </h2>
                  
                  <p className="text-gray-600 mb-6">
                    {filteredPosts[0].excerpt}
                  </p>
                  
                  <div className="flex flex-wrap gap-2 mb-6">
                    {filteredPosts[0].tags.map((tag) => (
                      <span
                        key={tag}
                        className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-sm"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                  
                  <Link href={`/blog/${filteredPosts[0].id}`} className="btn-primary">
                    Lire l&apos;article
                  </Link>
                </div>
              </div>
            </div>
          )}

          {/* Posts Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredPosts.slice(1).map((post) => (
              <article key={post.id} className="card overflow-hidden hover:shadow-lg transition-shadow">
                <Image
                  src={post.image}
                  alt={post.title}
                  width={400}
                  height={250}
                  className="w-full h-48 object-cover"
                />
                <div className="p-6">
                  <div className="flex items-center gap-4 mb-3 text-sm text-gray-500">
                    <div className="flex items-center">
                      <Calendar className="w-4 h-4 mr-1" />
                      {formatDate(post.date)}
                    </div>
                    <div className="flex items-center">
                      <User className="w-4 h-4 mr-1" />
                      {post.author}
                    </div>
                  </div>
                  
                  <h3 className="text-xl font-semibold text-gray-900 mb-3 line-clamp-2">
                    {post.title}
                  </h3>
                  
                  <p className="text-gray-600 mb-4 line-clamp-3">
                    {post.excerpt}
                  </p>
                  
                  <div className="flex flex-wrap gap-2 mb-4">
                    {post.tags.slice(0, 2).map((tag) => (
                      <span
                        key={tag}
                        className="bg-gray-100 text-gray-700 px-2 py-1 rounded-full text-xs"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                  
                  <Link 
                    href={`/blog/${post.id}`} 
                    className="text-nice-blue hover:underline font-medium"
                  >
                    Lire la suite →
                  </Link>
                </div>
              </article>
            ))}
          </div>

          {filteredPosts.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-500 text-lg">
                Aucun article trouvé pour cette catégorie.
              </p>
            </div>
          )}
        </div>
      </section>

      {/* Newsletter CTA */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Restez Informé
          </h2>
          <p className="text-xl text-gray-600 mb-8">
            Abonnez-vous à notre newsletter pour recevoir nos derniers articles 
            et actualités sur le Pan Bagnat niçois.
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