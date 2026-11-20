import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import type { CurrentUser, LoginRequest, RegisterRequest } from '../../types/index.js'
import { fetchCurrentUser, login as loginRequest, logout as logoutRequest, register as registerRequest } from '../../services/authApi.js'

/**
 * Контекст серверной cookie-сессии.
 *
 * При старте провайдер спрашивает `GET /api/auth/me`: пока ответ не получен,
 * `initializing` равно `true`, поэтому guard не успевает перенаправить
 * пользователя на `/login` раньше времени. Вход, регистрация и выход идут
 * через `/api/auth/*`, а пользователь в состоянии — только безопасный DTO.
 */
export interface AuthContextValue {
  user: CurrentUser | null
  isAuthenticated: boolean
  /** `true`, пока загружается текущая сессия при старте приложения. */
  initializing: boolean
  /** `true`, пока выполняется вход, регистрация или выход. */
  pending: boolean
  login: (request: LoginRequest) => Promise<void>
  register: (request: RegisterRequest) => Promise<void>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<CurrentUser | null>(null)
  const [initializing, setInitializing] = useState(true)
  const [pending, setPending] = useState(false)

  useEffect(() => {
    let cancelled = false

    void (async () => {
      try {
        const currentUser = await fetchCurrentUser()
        if (!cancelled) {
          setUser(currentUser)
        }
      } catch {
        // Сеть или сервер недоступны — считаем сессию отсутствующей.
        if (!cancelled) {
          setUser(null)
        }
      } finally {
        if (!cancelled) {
          setInitializing(false)
        }
      }
    })()

    return () => {
      cancelled = true
    }
  }, [])

  const login = useCallback(async (request: LoginRequest) => {
    setPending(true)
    try {
      const currentUser = await loginRequest(request)
      setUser(currentUser)
    } finally {
      setPending(false)
    }
  }, [])

  const register = useCallback(async (request: RegisterRequest) => {
    setPending(true)
    try {
      const currentUser = await registerRequest(request)
      setUser(currentUser)
    } finally {
      setPending(false)
    }
  }, [])

  const logout = useCallback(async () => {
    setPending(true)
    try {
      await logoutRequest()
    } catch {
      // Cookie могла истечь или сервер недоступен: локальное состояние всё
      // равно очищается, чтобы пользователь вернулся на страницу входа.
    } finally {
      setUser(null)
      setPending(false)
    }
  }, [])

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isAuthenticated: user !== null,
      initializing,
      pending,
      login,
      register,
      logout,
    }),
    [user, initializing, pending, login, register, logout],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

/** Доступ к сессии приложения; требует `AuthProvider` выше по дереву. */
export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth должен вызываться внутри AuthProvider')
  return context
}
