import type { ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router'
import { LoadingState } from '@kanbex/ui'
import { useAuth } from '../features/auth/index.js'

/**
 * Клиентский guard навигации. Перенаправляет на `/login`, сохраняя исходный
 * адрес, но не заменяет серверную авторизацию API.
 */
export function RequireAuth({ children }: { children: ReactNode }) {
  const { isAuthenticated, initializing } = useAuth()
  const location = useLocation()

  if (initializing) {
    return (
      <div className="kb-page">
        <LoadingState label="Проверка сессии…" />
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />
  }

  return <>{children}</>
}
