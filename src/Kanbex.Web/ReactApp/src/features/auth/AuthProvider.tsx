import { createContext, useCallback, useContext, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import type { CurrentUser, LoginRequest, RegisterRequest } from '../../types/index.js'

/**
 * Контекст демонстрационной сессии. Пока Identity/API не подключены,
 * провайдер хранит пользователя в памяти и sessionStorage, повторяя форму
 * будущего контракта `/api/auth/*`.
 */
export interface AuthContextValue {
  user: CurrentUser | null
  isAuthenticated: boolean
  /** `true`, пока идёт «запрос» к API. */
  pending: boolean
  login: (request: LoginRequest) => Promise<void>
  register: (request: RegisterRequest) => Promise<void>
  logout: () => void
}

const STORAGE_KEY = 'kanbex.demo.session'

function createGuestUser(): CurrentUser {
  return {
    id: 'demo-user',
    displayName: 'Гость-учащийся',
    email: 'student@kanbex.local',
  }
}

function readStoredUser(): CurrentUser | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY)
    if (!raw) return createGuestUser()
    const parsed = JSON.parse(raw) as CurrentUser
    return parsed && typeof parsed.id === 'string' ? parsed : createGuestUser()
  } catch {
    return createGuestUser()
  }
}

function persistUser(user: CurrentUser | null) {
  if (typeof window === 'undefined') return
  if (!user) {
    window.sessionStorage.removeItem(STORAGE_KEY)
    return
  }
  window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(user))
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  // Демо-режим: гостевая сессия создаётся сразу, чтобы доска была доступна
  // без серверной Identity. После выхода пользователь попадает на /login.
  const [user, setUser] = useState<CurrentUser | null>(readStoredUser)
  const [pending, setPending] = useState(false)

  const login = useCallback(async (request: LoginRequest) => {
    setPending(true)
    try {
      // TODO: заменить на POST /api/auth/login с cookie-сессией.
      setUser({
        id: 'demo-user',
        displayName: request.email.split('@')[0] || 'Учащийся',
        email: request.email,
      })
      persistUser({
        id: 'demo-user',
        displayName: request.email.split('@')[0] || 'Учащийся',
        email: request.email,
      })
    } finally {
      setPending(false)
    }
  }, [])

  const register = useCallback(async (request: RegisterRequest) => {
    setPending(true)
    try {
      // TODO: заменить на POST /api/auth/register.
      const nextUser: CurrentUser = {
        id: 'demo-user',
        displayName: request.displayName || 'Учащийся',
        email: request.email,
      }
      setUser(nextUser)
      persistUser(nextUser)
    } finally {
      setPending(false)
    }
  }, [])

  const logout = useCallback(() => {
    // TODO: заменить на POST /api/auth/logout.
    setUser(null)
    persistUser(null)
  }, [])

  const value = useMemo<AuthContextValue>(
    () => ({ user, isAuthenticated: user !== null, pending, login, register, logout }),
    [user, pending, login, register, logout],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

/** Доступ к сессии приложения; требует `AuthProvider` выше по дереву. */
export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth должен вызываться внутри AuthProvider')
  return context
}
