import { useState } from 'react'
import { Link, useNavigate } from 'react-router'
import { AppHeader, KanbexLogo, StatusBadge } from '@kanbex/ui'
import { LoginForm, useAuth } from '../features/auth/index.js'
import { describeApiError } from '../services/api.js'
import type { LoginRequest } from '../types/index.js'

/**
 * Страница входа. Форма обращается к `POST /api/auth/login`; сервер открывает
 * cookie-сессию, после чего клиентский guard пускает к доскам.
 */
export function LoginPage() {
  const { login, pending, user } = useAuth()
  const navigate = useNavigate()
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (request: LoginRequest) => {
    setError(null)
    try {
      await login(request)
      navigate('/boards', { replace: true })
    } catch (submitError) {
      setError(describeApiError(submitError))
    }
  }

  return (
    <div className="kb-auth-page">
      <AppHeader subtitle="Тренажёр Kanban-потока" logo={<KanbexLogo height={30} />} />
      <main className="kb-auth">
        <div className="kb-auth__card">
          <h1 className="kb-auth__title">Вход</h1>
          <p className="kb-auth__lead">
            Войдите в учебный аккаунт. Демонстрационная запись:{' '}
            <code>student@kanbex.local</code> / <code>Student1</code>.
          </p>
          {user ? (
            <p className="kb-auth__note">
              <StatusBadge tone="success" withDot>
                Вы уже вошли как {user.displayName}
              </StatusBadge>{' '}
              <Link to="/boards">Перейти к доскам</Link>
            </p>
          ) : null}
          <LoginForm onSubmit={handleSubmit} pending={pending} error={error} />
          <p className="kb-auth__footer">
            Нет аккаунта? <Link to="/register">Зарегистрироваться</Link>
          </p>
        </div>
      </main>
    </div>
  )
}
