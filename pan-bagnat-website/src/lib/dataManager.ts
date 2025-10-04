// Data management library for blog posts, events, and content
export interface BlogPost {
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
  slug?: string
  seo?: {
    metaTitle?: string
    metaDescription?: string
    keywords?: string[]
  }
  createdAt: string
  updatedAt: string
}

export interface Event {
  id: string
  title: string
  date: string
  time: string
  location: string
  description: string
  category: 'festival' | 'atelier' | 'degustation' | 'conference'
  maxParticipants?: number
  participants: number
  image?: string
  price?: number
  registrationUrl?: string
  createdAt: string
  updatedAt: string
}

export interface PageContent {
  id: string
  page: 'home' | 'tradition' | 'contact' | 'about'
  title: string
  content: string
  seo?: {
    metaTitle?: string
    metaDescription?: string
    keywords?: string[]
  }
  updatedAt: string
}

export interface MediaFile {
  id: string
  name: string
  url: string
  type: string
  size: number
  alt?: string
  uploadedAt: string
}

class DataManager {
  private static instance: DataManager
  private storageKey = 'pan_bagnat_data'

  static getInstance(): DataManager {
    if (!DataManager.instance) {
      DataManager.instance = new DataManager()
    }
    return DataManager.instance
  }

  private getData() {
    try {
      const data = localStorage.getItem(this.storageKey)
      return data ? JSON.parse(data) : this.getInitialData()
    } catch {
      return this.getInitialData()
    }
  }

  private saveData(data: any) {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(data))
    } catch (error) {
      console.error('Failed to save data:', error)
    }
  }

  private getInitialData() {
    return {
      posts: [
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
          published: true,
          slug: 'secrets-pan-bagnat-authentique',
          createdAt: '2025-03-10T10:00:00Z',
          updatedAt: '2025-03-10T10:00:00Z'
        }
      ],
      events: [
        {
          id: '1',
          title: 'Festival du Pan Bagnat 2025',
          date: '2025-03-15',
          time: '10:00 - 18:00',
          location: 'Place Masséna, Nice',
          description: 'Le grand rendez-vous annuel des amoureux du Pan Bagnat niçois.',
          category: 'festival' as const,
          maxParticipants: 500,
          participants: 245,
          price: 0,
          createdAt: '2025-03-01T10:00:00Z',
          updatedAt: '2025-03-01T10:00:00Z'
        }
      ],
      pageContent: [
        {
          id: 'home',
          page: 'home' as const,
          title: 'Bienvenue sur Pan Bagnat Niçois',
          content: '<p>Découvrez l\'authenticité du Pan Bagnat traditionnel de Nice...</p>',
          updatedAt: new Date().toISOString()
        }
      ],
      media: []
    }
  }

  // Blog Posts
  getPosts(): BlogPost[] {
    return this.getData().posts || []
  }

  getPost(id: string): BlogPost | null {
    const posts = this.getPosts()
    return posts.find(post => post.id === id) || null
  }

  savePost(post: Partial<BlogPost>): BlogPost {
    const data = this.getData()
    const now = new Date().toISOString()
    
    if (post.id) {
      // Update existing post
      const index = data.posts.findIndex((p: BlogPost) => p.id === post.id)
      if (index !== -1) {
        data.posts[index] = {
          ...data.posts[index],
          ...post,
          updatedAt: now
        }
        this.saveData(data)
        return data.posts[index]
      }
    }
    
    // Create new post
    const newPost: BlogPost = {
      id: Date.now().toString(),
      title: post.title || '',
      excerpt: post.excerpt || '',
      content: post.content || '',
      author: post.author || 'Admin',
      date: post.date || new Date().toISOString().split('T')[0],
      category: post.category || 'tradition',
      image: post.image || 'https://images.unsplash.com/photo-1539252554453-80ab65ce3586?w=600',
      tags: post.tags || [],
      published: post.published || false,
      slug: this.generateSlug(post.title || ''),
      seo: post.seo,
      createdAt: now,
      updatedAt: now
    }
    
    data.posts.push(newPost)
    this.saveData(data)
    return newPost
  }

  deletePost(id: string): boolean {
    const data = this.getData()
    const initialLength = data.posts.length
    data.posts = data.posts.filter((post: BlogPost) => post.id !== id)
    
    if (data.posts.length < initialLength) {
      this.saveData(data)
      return true
    }
    return false
  }

  // Events
  getEvents(): Event[] {
    return this.getData().events || []
  }

  getEvent(id: string): Event | null {
    const events = this.getEvents()
    return events.find(event => event.id === id) || null
  }

  saveEvent(event: Partial<Event>): Event {
    const data = this.getData()
    const now = new Date().toISOString()
    
    if (event.id) {
      // Update existing event
      const index = data.events.findIndex((e: Event) => e.id === event.id)
      if (index !== -1) {
        data.events[index] = {
          ...data.events[index],
          ...event,
          updatedAt: now
        }
        this.saveData(data)
        return data.events[index]
      }
    }
    
    // Create new event
    const newEvent: Event = {
      id: Date.now().toString(),
      title: event.title || '',
      date: event.date || '',
      time: event.time || '',
      location: event.location || '',
      description: event.description || '',
      category: event.category || 'festival',
      maxParticipants: event.maxParticipants,
      participants: event.participants || 0,
      image: event.image,
      price: event.price,
      registrationUrl: event.registrationUrl,
      createdAt: now,
      updatedAt: now
    }
    
    data.events.push(newEvent)
    this.saveData(data)
    return newEvent
  }

  deleteEvent(id: string): boolean {
    const data = this.getData()
    const initialLength = data.events.length
    data.events = data.events.filter((event: Event) => event.id !== id)
    
    if (data.events.length < initialLength) {
      this.saveData(data)
      return true
    }
    return false
  }

  // Page Content
  getPageContent(page: string): PageContent | null {
    const data = this.getData()
    return data.pageContent.find((content: PageContent) => content.page === page) || null
  }

  savePageContent(content: Partial<PageContent>): PageContent {
    const data = this.getData()
    const now = new Date().toISOString()
    
    const existingIndex = data.pageContent.findIndex((c: PageContent) => c.page === content.page)
    
    if (existingIndex !== -1) {
      // Update existing content
      data.pageContent[existingIndex] = {
        ...data.pageContent[existingIndex],
        ...content,
        updatedAt: now
      }
      this.saveData(data)
      return data.pageContent[existingIndex]
    } else {
      // Create new content
      const newContent: PageContent = {
        id: content.page || Date.now().toString(),
        page: content.page as any,
        title: content.title || '',
        content: content.content || '',
        seo: content.seo,
        updatedAt: now
      }
      
      data.pageContent.push(newContent)
      this.saveData(data)
      return newContent
    }
  }

  // Media
  getMedia(): MediaFile[] {
    return this.getData().media || []
  }

  saveMedia(media: Partial<MediaFile>): MediaFile {
    const data = this.getData()
    
    const newMedia: MediaFile = {
      id: Date.now().toString(),
      name: media.name || '',
      url: media.url || '',
      type: media.type || '',
      size: media.size || 0,
      alt: media.alt,
      uploadedAt: new Date().toISOString()
    }
    
    data.media.push(newMedia)
    this.saveData(data)
    return newMedia
  }

  deleteMedia(id: string): boolean {
    const data = this.getData()
    const initialLength = data.media.length
    data.media = data.media.filter((media: MediaFile) => media.id !== id)
    
    if (data.media.length < initialLength) {
      this.saveData(data)
      return true
    }
    return false
  }

  // Utilities
  private generateSlug(title: string): string {
    return title
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim()
  }

  // Export/Import
  exportData() {
    return this.getData()
  }

  importData(data: any) {
    try {
      this.saveData(data)
      return true
    } catch {
      return false
    }
  }

  // Statistics
  getStats() {
    const data = this.getData()
    const posts = data.posts || []
    const events = data.events || []
    
    return {
      totalPosts: posts.length,
      publishedPosts: posts.filter((p: BlogPost) => p.published).length,
      draftPosts: posts.filter((p: BlogPost) => !p.published).length,
      totalEvents: events.length,
      upcomingEvents: events.filter((e: Event) => new Date(e.date) > new Date()).length,
      totalMedia: data.media?.length || 0
    }
  }
}

export const dataManager = DataManager.getInstance()