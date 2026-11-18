import type { ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router'
import { useAuth } from '../features/auth/index.js'

/**
 * Клиентский guard навигации. Перенаправляет на `/login`, сохраняя исходный
 * адрес, но не заменяет серверную авторизацию API.
 */
export function RequireAuth({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useAuth()
  const location = useLocation()

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />
  }

  return <>{children}</>
}
