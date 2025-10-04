'use client'

import { useState } from 'react'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import Chatbot from '@/components/Chatbot'
import { Mail, Phone, MapPin, Send, Facebook, Instagram, Twitter } from 'lucide-react'

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // Ici, vous intégreriez l'envoi du formulaire
    console.log('Formulaire soumis:', formData)
    alert('Merci pour votre message ! Nous vous répondrons bientôt.')
    setFormData({ name: '', email: '', subject: '', message: '' })
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  return (
    <main>
      <Header />
      
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-nice-blue to-mediterranean text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl font-bold mb-4">Contactez-Nous</h1>
            <p className="text-xl opacity-90 max-w-3xl mx-auto">
              Une question sur le Pan Bagnat ? Une suggestion ? 
              Nous sommes là pour échanger sur notre passion commune.
            </p>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* Contact Form */}
            <div className="card">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">
                Envoyez-nous un message
              </h2>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                    Nom complet
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-nice-blue focus:border-transparent"
                    placeholder="Votre nom et prénom"
                  />
                </div>

                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                    Adresse email
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-nice-blue focus:border-transparent"
                    placeholder="votre.email@exemple.com"
                  />
                </div>

                <div>
                  <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-2">
                    Sujet
                  </label>
                  <select
                    id="subject"
                    name="subject"
                    value={formData.subject}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-nice-blue focus:border-transparent"
                  >
                    <option value="">Sélectionnez un sujet</option>
                    <option value="information">Demande d&apos;information</option>
                    <option value="evenement">Question sur un événement</option>
                    <option value="recette">Question sur les recettes</option>
                    <option value="partenariat">Proposition de partenariat</option>
                    <option value="presse">Demande presse</option>
                    <option value="autre">Autre</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-2">
                    Message
                  </label>
                  <textarea
                    id="message"
                    name="message"
                    rows={6}
                    value={formData.message}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-nice-blue focus:border-transparent"
                    placeholder="Votre message..."
                  />
                </div>

                <button
                  type="submit"
                  className="w-full btn-primary flex items-center justify-center"
                >
                  <Send className="w-5 h-5 mr-2" />
                  Envoyer le message
                </button>
              </form>
            </div>

            {/* Contact Info */}
            <div className="space-y-8">
              {/* Information */}
              <div className="card">
                <h3 className="text-xl font-bold text-gray-900 mb-6">
                  Informations de contact
                </h3>

                <div className="space-y-4">
                  <div className="flex items-start">
                    <MapPin className="w-6 h-6 text-nice-blue mr-4 mt-1" />
                    <div>
                      <h4 className="font-semibold text-gray-900">Adresse</h4>
                      <p className="text-gray-600">
                        Place Masséna<br />
                        06000 Nice<br />
                        Côte d&apos;Azur, France
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start">
                    <Mail className="w-6 h-6 text-nice-blue mr-4 mt-1" />
                    <div>
                      <h4 className="font-semibold text-gray-900">Email</h4>
                      <p className="text-gray-600">
                        <a href="mailto:contact@panbagnatnipois.com" className="hover:text-nice-blue transition-colors">
                          contact@panbagnatnipois.com
                        </a>
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start">
                    <Phone className="w-6 h-6 text-nice-blue mr-4 mt-1" />
                    <div>
                      <h4 className="font-semibold text-gray-900">Téléphone</h4>
                      <p className="text-gray-600">
                        <a href="tel:+33493876543" className="hover:text-nice-blue transition-colors">
                          +33 4 93 87 65 43
                        </a>
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Réseaux sociaux */}
              <div className="card">
                <h3 className="text-xl font-bold text-gray-900 mb-6">
                  Suivez-nous
                </h3>

                <div className="flex space-x-4">
                  <a
                    href="#"
                    className="bg-blue-600 text-white p-3 rounded-full hover:bg-blue-700 transition-colors"
                  >
                    <Facebook className="w-6 h-6" />
                  </a>
                  <a
                    href="#"
                    className="bg-pink-600 text-white p-3 rounded-full hover:bg-pink-700 transition-colors"
                  >
                    <Instagram className="w-6 h-6" />
                  </a>
                  <a
                    href="#"
                    className="bg-blue-400 text-white p-3 rounded-full hover:bg-blue-500 transition-colors"
                  >
                    <Twitter className="w-6 h-6" />
                  </a>
                </div>

                <p className="text-gray-600 mt-4">
                  Rejoignez notre communauté sur les réseaux sociaux pour ne rien manquer 
                  de l&apos;actualité du Pan Bagnat niçois !
                </p>
              </div>

              {/* Horaires */}
              <div className="card">
                <h3 className="text-xl font-bold text-gray-900 mb-6">
                  Horaires d&apos;ouverture
                </h3>

                <div className="space-y-2 text-gray-600">
                  <div className="flex justify-between">
                    <span>Lundi - Vendredi</span>
                    <span>9h00 - 18h00</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Samedi</span>
                    <span>9h00 - 17h00</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Dimanche</span>
                    <span>Fermé</span>
                  </div>
                </div>

                <p className="text-sm text-gray-500 mt-4">
                  * Horaires susceptibles de changer pendant les événements spéciaux
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Questions Fréquentes
            </h2>
            <p className="text-xl text-gray-600">
              Trouvez rapidement les réponses aux questions les plus courantes.
            </p>
          </div>

          <div className="space-y-8">
            <div className="card">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">
                Qu&apos;est-ce qui rend le Pan Bagnat niçois authentique ?
              </h3>
              <p className="text-gray-600">
                L&apos;authenticité du Pan Bagnat niçois réside dans le respect de la recette traditionnelle, 
                l&apos;utilisation d&apos;ingrédients locaux de qualité et les techniques de préparation 
                transmises de génération en génération.
              </p>
            </div>

            <div className="card">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">
                Comment participer à vos événements ?
              </h3>
              <p className="text-gray-600">
                Vous pouvez vous inscrire à nos événements directement sur notre page 
                &quot;Événements&quot; ou nous contacter par email. Les places sont limitées 
                pour garantir la qualité de l&apos;expérience.
              </p>
            </div>

            <div className="card">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">
                Proposez-vous des cours de cuisine ?
              </h3>
              <p className="text-gray-600">
                Oui, nous organisons régulièrement des ateliers de préparation du Pan Bagnat 
                avec nos maîtres artisans. Ces cours pratiques vous permettent d&apos;apprendre 
                toutes les subtilités de la préparation traditionnelle.
              </p>
            </div>

            <div className="card">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">
                Puis-je devenir partenaire ou bénévole ?
              </h3>
              <p className="text-gray-600">
                Nous sommes toujours ouverts aux collaborations avec des artisans, 
                producteurs locaux et passionnés qui partagent nos valeurs. 
                Contactez-nous pour discuter des opportunités de partenariat.
              </p>
            </div>
          </div>
        </div>
      </section>

      <Footer />
      <Chatbot />
    </main>
  )
}