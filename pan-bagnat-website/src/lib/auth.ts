// Authentication library for admin access
export interface User {
  id: string
  username: string
  email: string
  role: 'admin' | 'editor'
  lastLogin?: string
}

export interface AuthState {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
}

// Simulated user database (in production, this would be a real database)
const USERS = [
  {
    id: '1',
    username: 'admin',
    email: 'admin@pan-bagnat.fr',
    password: 'admin123', // In production, this would be hashed
    role: 'admin' as const
  },
  {
    id: '2',
    username: 'editor',
    email: 'editor@pan-bagnat.fr', 
    password: 'editor123',
    role: 'editor' as const
  }
]

export class AuthService {
  private static instance: AuthService
  private listeners: ((state: AuthState) => void)[] = []

  static getInstance(): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService()
    }
    return AuthService.instance
  }

  subscribe(listener: (state: AuthState) => void) {
    this.listeners.push(listener)
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener)
    }
  }

  private notify(state: AuthState) {
    this.listeners.forEach(listener => listener(state))
  }

  async login(username: string, password: string): Promise<{ success: boolean; error?: string; user?: User }> {
    try {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000))

      const user = USERS.find(u => u.username === username && u.password === password)
      
      if (!user) {
        return { success: false, error: 'Nom d\'utilisateur ou mot de passe incorrect' }
      }

      const userData: User = {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        lastLogin: new Date().toISOString()
      }

      // Store in localStorage
      localStorage.setItem('pan_bagnat_auth', JSON.stringify({
        user: userData,
        token: this.generateToken(),
        expiresAt: Date.now() + (24 * 60 * 60 * 1000) // 24 hours
      }))

      this.notify({
        user: userData,
        isAuthenticated: true,
        isLoading: false
      })

      return { success: true, user: userData }
    } catch (error) {
      return { success: false, error: 'Erreur de connexion' }
    }
  }

  logout() {
    localStorage.removeItem('pan_bagnat_auth')
    this.notify({
      user: null,
      isAuthenticated: false,
      isLoading: false
    })
  }

  getCurrentUser(): User | null {
    try {
      const authData = localStorage.getItem('pan_bagnat_auth')
      if (!authData) return null

      const { user, expiresAt } = JSON.parse(authData)
      
      if (Date.now() > expiresAt) {
        this.logout()
        return null
      }

      return user
    } catch {
      return null
    }
  }

  isAuthenticated(): boolean {
    return this.getCurrentUser() !== null
  }

  hasRole(role: 'admin' | 'editor'): boolean {
    const user = this.getCurrentUser()
    if (!user) return false
    
    if (role === 'admin') {
      return user.role === 'admin'
    }
    
    return user.role === 'admin' || user.role === 'editor'
  }

  private generateToken(): string {
    return Math.random().toString(36).substring(2) + Date.now().toString(36)
  }

  // Check if session is still valid
  validateSession(): boolean {
    try {
      const authData = localStorage.getItem('pan_bagnat_auth')
      if (!authData) return false

      const { expiresAt } = JSON.parse(authData)
      return Date.now() < expiresAt
    } catch {
      return false
    }
  }

  // Extend session
  extendSession() {
    try {
      const authData = localStorage.getItem('pan_bagnat_auth')
      if (!authData) return

      const data = JSON.parse(authData)
      data.expiresAt = Date.now() + (24 * 60 * 60 * 1000)
      
      localStorage.setItem('pan_bagnat_auth', JSON.stringify(data))
    } catch {
      // Ignore errors
    }
  }
}

export const authService = AuthService.getInstance()