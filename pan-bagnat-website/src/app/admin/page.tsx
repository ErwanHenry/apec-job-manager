'use client'

import { useState } from 'react'
import dynamic from 'next/dynamic'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import { Save, Eye, Plus, Edit, Trash, Calendar, User } from 'lucide-react'

// Import dynamic pour éviter les erreurs SSR avec React Quill
const ReactQuill = dynamic(() => import('react-quill'), { ssr: false })
import 'react-quill/dist/quill.snow.css'

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
  published: boolean
}

interface Event {
  id: string
  title: string
  date: string
  time: string
  location: string
  description: string
  category: 'festival' | 'atelier' | 'degustation' | 'conference'
  maxParticipants?: number
}

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState<'posts' | 'events'>('posts')
  const [isEditing, setIsEditing] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)

  // Blog Posts State
  const [posts, setPosts] = useState<BlogPost[]>([
    {
      id: '1',
      title: 'Les Secrets d\'un Pan Bagnat Authentique',
      excerpt: 'Découvrez les techniques traditionnelles pour préparer le parfait Pan Bagnat niçois.',
      content: '<p>Le Pan Bagnat authentique nécessite une attention particulière à chaque détail...</p>',
      author: 'Marie Dubois',
      date: '2025-03-10',
      category: 'tradition',
      image: 'https://images.unsplash.com/photo-1539252554453-80ab65ce3586?w=600',
      tags: ['tradition', 'recette', 'technique'],
      published: true
    }
  ])

  const [currentPost, setCurrentPost] = useState<Partial<BlogPost>>({
    title: '',
    excerpt: '',
    content: '',
    author: '',
    category: 'tradition',
    image: '',
    tags: [],
    published: false
  })

  // Events State
  const [events, setEvents] = useState<Event[]>([
    {
      id: '1',
      title: 'Festival du Pan Bagnat 2025',
      date: '2025-03-15',
      time: '10:00 - 18:00',
      location: 'Place Masséna, Nice',
      description: 'Le grand rendez-vous annuel des amoureux du Pan Bagnat niçois.',
      category: 'festival',
      maxParticipants: 500
    }
  ])

  const [currentEvent, setCurrentEvent] = useState<Partial<Event>>({
    title: '',
    date: '',
    time: '',
    location: '',
    description: '',
    category: 'festival',
    maxParticipants: undefined
  })

  // Categories
  const postCategories = ['tradition', 'histoire', 'ingredients', 'événements', 'nutrition', 'saisons']
  const eventCategories = ['festival', 'atelier', 'degustation', 'conference']

  // Quill modules configuration
  const quillModules = {
    toolbar: [
      [{ 'header': [1, 2, 3, false] }],
      ['bold', 'italic', 'underline', 'strike'],
      [{ 'list': 'ordered'}, { 'list': 'bullet' }],
      ['link', 'image'],
      ['clean']
    ],
  }

  // Blog Post Functions
  const handleSavePost = () => {
    if (!currentPost.title || !currentPost.content) return

    const post: BlogPost = {
      id: editingId || Date.now().toString(),
      title: currentPost.title || '',
      excerpt: currentPost.excerpt || '',
      content: currentPost.content || '',
      author: currentPost.author || 'Admin',
      date: new Date().toISOString().split('T')[0],
      category: currentPost.category || 'tradition',
      image: currentPost.image || 'https://images.unsplash.com/photo-1539252554453-80ab65ce3586?w=600',
      tags: Array.isArray(currentPost.tags) ? currentPost.tags : [],
      published: currentPost.published || false
    }

    if (editingId) {
      setPosts(posts.map(p => p.id === editingId ? post : p))
    } else {
      setPosts([...posts, post])
    }

    resetPostForm()
  }

  const handleEditPost = (post: BlogPost) => {
    setCurrentPost(post)
    setEditingId(post.id)
    setIsEditing(true)
  }

  const handleDeletePost = (id: string) => {
    setPosts(posts.filter(p => p.id !== id))
  }

  const resetPostForm = () => {
    setCurrentPost({
      title: '',
      excerpt: '',
      content: '',
      author: '',
      category: 'tradition',
      image: '',
      tags: [],
      published: false
    })
    setEditingId(null)
    setIsEditing(false)
  }

  // Event Functions
  const handleSaveEvent = () => {
    if (!currentEvent.title || !currentEvent.date) return

    const event: Event = {
      id: editingId || Date.now().toString(),
      title: currentEvent.title || '',
      date: currentEvent.date || '',
      time: currentEvent.time || '',
      location: currentEvent.location || '',
      description: currentEvent.description || '',
      category: currentEvent.category || 'festival',
      maxParticipants: currentEvent.maxParticipants
    }

    if (editingId) {
      setEvents(events.map(e => e.id === editingId ? event : e))
    } else {
      setEvents([...events, event])
    }

    resetEventForm()
  }

  const handleEditEvent = (event: Event) => {
    setCurrentEvent(event)
    setEditingId(event.id)
    setIsEditing(true)
  }

  const handleDeleteEvent = (id: string) => {
    setEvents(events.filter(e => e.id !== id))
  }

  const resetEventForm = () => {
    setCurrentEvent({
      title: '',
      date: '',
      time: '',
      location: '',
      description: '',
      category: 'festival',
      maxParticipants: undefined
    })
    setEditingId(null)
    setIsEditing(false)
  }

  return (
    <main>
      <Header />
      
      {/* Admin Header */}
      <section className="bg-gray-900 text-white py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold">Administration Pan Bagnat</h1>
          <p className="text-gray-300 mt-2">Gestion du contenu et des événements</p>
        </div>
      </section>

      {/* Admin Content */}
      <section className="py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Tabs */}
          <div className="border-b border-gray-200 mb-8">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveTab('posts')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'posts'
                    ? 'border-nice-blue text-nice-blue'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                Articles de Blog
              </button>
              <button
                onClick={() => setActiveTab('events')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'events'
                    ? 'border-nice-blue text-nice-blue'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                Événements
              </button>
            </nav>
          </div>

          {/* Blog Posts Management */}
          {activeTab === 'posts' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Editor */}
              <div className="lg:col-span-2">
                <div className="card">
                  <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold">
                      {isEditing ? 'Modifier l&apos;article' : 'Nouvel article'}
                    </h2>
                    <div className="flex gap-2">
                      <button onClick={resetPostForm} className="btn-secondary">
                        <Plus className="w-4 h-4 mr-2" />
                        Nouveau
                      </button>
                      <button onClick={handleSavePost} className="btn-primary">
                        <Save className="w-4 h-4 mr-2" />
                        Sauvegarder
                      </button>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <input
                      type="text"
                      placeholder="Titre de l'article"
                      value={currentPost.title || ''}
                      onChange={(e) => setCurrentPost({...currentPost, title: e.target.value})}
                      className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-nice-blue"
                    />

                    <textarea
                      placeholder="Extrait de l'article"
                      value={currentPost.excerpt || ''}
                      onChange={(e) => setCurrentPost({...currentPost, excerpt: e.target.value})}
                      rows={3}
                      className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-nice-blue"
                    />

                    <div className="grid grid-cols-2 gap-4">
                      <input
                        type="text"
                        placeholder="Auteur"
                        value={currentPost.author || ''}
                        onChange={(e) => setCurrentPost({...currentPost, author: e.target.value})}
                        className="p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-nice-blue"
                      />

                      <select
                        value={currentPost.category || 'tradition'}
                        onChange={(e) => setCurrentPost({...currentPost, category: e.target.value})}
                        className="p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-nice-blue"
                      >
                        {postCategories.map(cat => (
                          <option key={cat} value={cat}>{cat}</option>
                        ))}
                      </select>
                    </div>

                    <input
                      type="url"
                      placeholder="URL de l'image"
                      value={currentPost.image || ''}
                      onChange={(e) => setCurrentPost({...currentPost, image: e.target.value})}
                      className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-nice-blue"
                    />

                    <input
                      type="text"
                      placeholder="Tags (séparés par des virgules)"
                      value={Array.isArray(currentPost.tags) ? currentPost.tags.join(', ') : ''}
                      onChange={(e) => setCurrentPost({
                        ...currentPost, 
                        tags: e.target.value.split(',').map(tag => tag.trim()).filter(tag => tag)
                      })}
                      className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-nice-blue"
                    />

                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={currentPost.published || false}
                        onChange={(e) => setCurrentPost({...currentPost, published: e.target.checked})}
                        className="mr-2"
                      />
                      Publier l&apos;article
                    </label>

                    <div className="border border-gray-300 rounded-md">
                      <ReactQuill
                        value={currentPost.content || ''}
                        onChange={(content) => setCurrentPost({...currentPost, content})}
                        modules={quillModules}
                        placeholder="Contenu de l&apos;article..."
                        style={{ height: '300px' }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Posts List */}
              <div className="card">
                <h3 className="text-lg font-bold mb-4">Articles existants</h3>
                <div className="space-y-4 max-h-96 overflow-y-auto">
                  {posts.map((post) => (
                    <div key={post.id} className="border border-gray-200 rounded-md p-4">
                      <h4 className="font-semibold text-sm mb-2">{post.title}</h4>
                      <div className="flex items-center gap-2 text-xs text-gray-500 mb-2">
                        <User className="w-3 h-3" />
                        {post.author}
                        <Calendar className="w-3 h-3 ml-2" />
                        {post.date}
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleEditPost(post)}
                          className="text-blue-600 hover:underline text-xs"
                        >
                          <Edit className="w-3 h-3" />
                        </button>
                        <button
                          onClick={() => handleDeletePost(post.id)}
                          className="text-red-600 hover:underline text-xs"
                        >
                          <Trash className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Events Management */}
          {activeTab === 'events' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Event Editor */}
              <div className="lg:col-span-2">
                <div className="card">
                  <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold">
                      {isEditing ? 'Modifier l&apos;événement' : 'Nouvel événement'}
                    </h2>
                    <div className="flex gap-2">
                      <button onClick={resetEventForm} className="btn-secondary">
                        <Plus className="w-4 h-4 mr-2" />
                        Nouveau
                      </button>
                      <button onClick={handleSaveEvent} className="btn-primary">
                        <Save className="w-4 h-4 mr-2" />
                        Sauvegarder
                      </button>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <input
                      type="text"
                      placeholder="Titre de l&apos;événement"
                      value={currentEvent.title || ''}
                      onChange={(e) => setCurrentEvent({...currentEvent, title: e.target.value})}
                      className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-nice-blue"
                    />

                    <div className="grid grid-cols-2 gap-4">
                      <input
                        type="date"
                        value={currentEvent.date || ''}
                        onChange={(e) => setCurrentEvent({...currentEvent, date: e.target.value})}
                        className="p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-nice-blue"
                      />

                      <input
                        type="text"
                        placeholder="Horaires (ex: 14:00 - 17:00)"
                        value={currentEvent.time || ''}
                        onChange={(e) => setCurrentEvent({...currentEvent, time: e.target.value})}
                        className="p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-nice-blue"
                      />
                    </div>

                    <input
                      type="text"
                      placeholder="Lieu"
                      value={currentEvent.location || ''}
                      onChange={(e) => setCurrentEvent({...currentEvent, location: e.target.value})}
                      className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-nice-blue"
                    />

                    <div className="grid grid-cols-2 gap-4">
                      <select
                        value={currentEvent.category || 'festival'}
                        onChange={(e) => setCurrentEvent({...currentEvent, category: e.target.value as any})}
                        className="p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-nice-blue"
                      >
                        {eventCategories.map(cat => (
                          <option key={cat} value={cat}>{cat}</option>
                        ))}
                      </select>

                      <input
                        type="number"
                        placeholder="Nombre max de participants"
                        value={currentEvent.maxParticipants || ''}
                        onChange={(e) => setCurrentEvent({
                          ...currentEvent, 
                          maxParticipants: e.target.value ? parseInt(e.target.value) : undefined
                        })}
                        className="p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-nice-blue"
                      />
                    </div>

                    <textarea
                      placeholder="Description de l&apos;événement"
                      value={currentEvent.description || ''}
                      onChange={(e) => setCurrentEvent({...currentEvent, description: e.target.value})}
                      rows={5}
                      className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-nice-blue"
                    />
                  </div>
                </div>
              </div>

              {/* Events List */}
              <div className="card">
                <h3 className="text-lg font-bold mb-4">Événements existants</h3>
                <div className="space-y-4 max-h-96 overflow-y-auto">
                  {events.map((event) => (
                    <div key={event.id} className="border border-gray-200 rounded-md p-4">
                      <h4 className="font-semibold text-sm mb-2">{event.title}</h4>
                      <div className="flex items-center gap-2 text-xs text-gray-500 mb-2">
                        <Calendar className="w-3 h-3" />
                        {event.date}
                      </div>
                      <p className="text-xs text-gray-600 mb-2">{event.location}</p>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleEditEvent(event)}
                          className="text-blue-600 hover:underline text-xs"
                        >
                          <Edit className="w-3 h-3" />
                        </button>
                        <button
                          onClick={() => handleDeleteEvent(event.id)}
                          className="text-red-600 hover:underline text-xs"
                        >
                          <Trash className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      <Footer />
    </main>
  )
}