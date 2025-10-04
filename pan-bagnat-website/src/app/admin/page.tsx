'use client'

import { useState, useEffect } from 'react'
import dynamic from 'next/dynamic'
import { useAuth } from '@/hooks/useAuth'
import LoginForm from '@/components/admin/LoginForm'
import Dashboard from '@/components/admin/Dashboard'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import { 
  Save, 
  Plus, 
  Edit, 
  Trash, 
  Calendar, 
  User, 
  LogOut,
  BarChart3,
  FileText,
  Settings,
  Image as ImageIcon,
  Globe
} from 'lucide-react'
import { dataManager, type BlogPost, type Event } from '@/lib/dataManager'

// Import dynamic pour éviter les erreurs SSR avec React Quill
const ReactQuill = dynamic(() => import('react-quill'), { ssr: false })
import 'react-quill/dist/quill.snow.css'

export default function AdminPage() {
  const { isAuthenticated, isLoading, user, logout } = useAuth()
  const [activeTab, setActiveTab] = useState<'dashboard' | 'posts' | 'events' | 'content' | 'media'>('dashboard')
  const [isEditing, setIsEditing] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  
  // Data State
  const [posts, setPosts] = useState<BlogPost[]>([])
  const [events, setEvents] = useState<Event[]>([])
  
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

  const [currentEvent, setCurrentEvent] = useState<Partial<Event>>({
    title: '',
    date: '',
    time: '',
    location: '',
    description: '',
    category: 'festival',
    maxParticipants: undefined,
    participants: 0
  })
  
  // Load data on mount
  useEffect(() => {
    setPosts(dataManager.getPosts())
    setEvents(dataManager.getEvents())
  }, [])

  // Update author when user changes
  useEffect(() => {
    if (user && !currentPost.author) {
      setCurrentPost(prev => ({ ...prev, author: user.username }))
    }
  }, [user, currentPost.author])
  
  // Redirect if not authenticated
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-nice-blue border-t-transparent"></div>
      </div>
    )
  }
  
  if (!isAuthenticated) {
    return <LoginForm onSuccess={() => window.location.reload()} />
  }

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

    const savedPost = dataManager.savePost({
      ...currentPost,
      id: editingId || undefined,
      author: currentPost.author || user?.username || 'Admin'
    })

    setPosts(dataManager.getPosts())
    resetPostForm()
  }

  const handleEditPost = (post: BlogPost) => {
    setCurrentPost(post)
    setEditingId(post.id)
    setIsEditing(true)
  }

  const handleDeletePost = (id: string) => {
    if (confirm('Êtes-vous sûr de vouloir supprimer cet article ?')) {
      dataManager.deletePost(id)
      setPosts(dataManager.getPosts())
    }
  }

  const resetPostForm = () => {
    setCurrentPost({
      title: '',
      excerpt: '',
      content: '',
      author: user?.username || '',
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

    const savedEvent = dataManager.saveEvent({
      ...currentEvent,
      id: editingId || undefined
    })

    setEvents(dataManager.getEvents())
    resetEventForm()
  }

  const handleEditEvent = (event: Event) => {
    setCurrentEvent(event)
    setEditingId(event.id)
    setIsEditing(true)
  }

  const handleDeleteEvent = (id: string) => {
    if (confirm('Êtes-vous sûr de vouloir supprimer cet événement ?')) {
      dataManager.deleteEvent(id)
      setEvents(dataManager.getEvents())
    }
  }

  const resetEventForm = () => {
    setCurrentEvent({
      title: '',
      date: '',
      time: '',
      location: '',
      description: '',
      category: 'festival',
      maxParticipants: undefined,
      participants: 0
    })
    setEditingId(null)
    setIsEditing(false)
  }

  const tabs = [
    { id: 'dashboard', label: 'Tableau de Bord', icon: BarChart3 },
    { id: 'posts', label: 'Articles', icon: FileText },
    { id: 'events', label: 'Événements', icon: Calendar },
    { id: 'content', label: 'Pages', icon: Globe },
    { id: 'media', label: 'Médias', icon: ImageIcon }
  ]

  return (
    <main>
      <Header />
      
      {/* Admin Header */}
      <section className="bg-gray-900 text-white py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">Administration Pan Bagnat</h1>
              <p className="text-gray-300 mt-1">Bienvenue {user?.username} • {user?.role}</p>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-300">
                Dernière connexion: {user?.lastLogin ? new Date(user.lastLogin).toLocaleDateString('fr-FR') : 'Première fois'}
              </span>
              <button
                onClick={logout}
                className="flex items-center px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md transition-colors"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Déconnexion
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Admin Content */}
      <section className="py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Tabs */}
          <div className="border-b border-gray-200 mb-8">
            <nav className="-mb-px flex space-x-8 overflow-x-auto">
              {tabs.map((tab) => {
                const Icon = tab.icon
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`flex items-center py-2 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                      activeTab === tab.id
                        ? 'border-nice-blue text-nice-blue'
                        : 'border-transparent text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    <Icon className="w-4 h-4 mr-2" />
                    {tab.label}
                  </button>
                )
              })}
            </nav>
          </div>

          {/* Dashboard */}
          {activeTab === 'dashboard' && <Dashboard />}

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

                    <input
                      type="number"
                      placeholder="Participants actuels"
                      value={currentEvent.participants || 0}
                      onChange={(e) => setCurrentEvent({
                        ...currentEvent, 
                        participants: parseInt(e.target.value) || 0
                      })}
                      className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-nice-blue"
                    />

                    <input
                      type="url"
                      placeholder="URL de l'image (optionnel)"
                      value={currentEvent.image || ''}
                      onChange={(e) => setCurrentEvent({...currentEvent, image: e.target.value})}
                      className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-nice-blue"
                    />

                    <div className="grid grid-cols-2 gap-4">
                      <input
                        type="number"
                        step="0.01"
                        placeholder="Prix (€)"
                        value={currentEvent.price || ''}
                        onChange={(e) => setCurrentEvent({
                          ...currentEvent, 
                          price: e.target.value ? parseFloat(e.target.value) : undefined
                        })}
                        className="p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-nice-blue"
                      />

                      <input
                        type="url"
                        placeholder="URL d'inscription"
                        value={currentEvent.registrationUrl || ''}
                        onChange={(e) => setCurrentEvent({...currentEvent, registrationUrl: e.target.value})}
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
                      <div className="text-xs text-gray-500 mb-2">
                        {event.participants || 0} participants
                        {event.maxParticipants && ` / ${event.maxParticipants} max`}
                      </div>
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

          {/* Content Management - Placeholder */}
          {activeTab === 'content' && (
            <div className="text-center py-12">
              <Globe className="w-16 h-16 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Gestion des Pages</h3>
              <p className="text-gray-500">Fonctionnalité en développement</p>
            </div>
          )}

          {/* Media Management - Placeholder */}
          {activeTab === 'media' && (
            <div className="text-center py-12">
              <ImageIcon className="w-16 h-16 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Gestion des Médias</h3>
              <p className="text-gray-500">Fonctionnalité en développement</p>
            </div>
          )}
        </div>
      </section>

      <Footer />
    </main>
  )
}