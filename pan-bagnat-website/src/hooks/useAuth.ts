'use client'

import { useState, useEffect } from 'react'
import { authService, type AuthState, type User } from '@/lib/auth'

export function useAuth() {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
    isLoading: true
  })

  useEffect(() => {
    // Initialize auth state
    const user = authService.getCurrentUser()
    setAuthState({
      user,
      isAuthenticated: !!user,
      isLoading: false
    })

    // Subscribe to auth changes
    const unsubscribe = authService.subscribe((state) => {
      setAuthState(state)
    })

    return unsubscribe
  }, [])

  // Auto-extend session on activity
  useEffect(() => {
    const handleActivity = () => {
      if (authState.isAuthenticated) {
        authService.extendSession()
      }
    }

    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart']
    events.forEach(event => {
      document.addEventListener(event, handleActivity, true)
    })

    return () => {
      events.forEach(event => {
        document.removeEventListener(event, handleActivity, true)
      })
    }
  }, [authState.isAuthenticated])

  // Session validation
  useEffect(() => {
    if (authState.isAuthenticated && !authService.validateSession()) {
      authService.logout()
    }
  }, [authState.isAuthenticated])

  const login = async (username: string, password: string) => {
    setAuthState(prev => ({ ...prev, isLoading: true }))
    return authService.login(username, password)
  }

  const logout = () => {
    authService.logout()
  }

  const hasRole = (role: 'admin' | 'editor') => {
    return authService.hasRole(role)
  }

  return {
    ...authState,
    login,
    logout,
    hasRole
  }
}