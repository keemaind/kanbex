import { Link, useNavigate } from 'react-router'
import { AppHeader, KanbexLogo, StatusBadge } from '@kanbex/ui'
import { LoginForm, useAuth } from '../features/auth/index.js'
import type { LoginRequest } from '../types/index.js'

/**
 * Страница входа. После подключения Identity форма будет обращаться
 * к `POST /api/auth/login`, а редирект выполнит клиентский guard.
 */
export function LoginPage() {
  const { login, pending, user } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (request: LoginRequest) => {
    await login(request)
    navigate('/boards')
  }

  return (
    <div className="kb-auth-page">
      <AppHeader subtitle="Тренажёр Kanban-потока" logo={<KanbexLogo height={30} />} />
      <main className="kb-auth">
        <div className="kb-auth__card">
          <h1 className="kb-auth__title">Вход</h1>
          <p className="kb-auth__lead">
            Демонстрационная сессия: любые корректные данные создают локального пользователя.
          </p>
          {user ? (
            <p className="kb-auth__note">
              <StatusBadge tone="success" withDot>
                Вы уже вошли как {user.displayName}
              </StatusBadge>{' '}
              <Link to="/boards">Перейти к доскам</Link>
            </p>
          ) : null}
          <LoginForm onSubmit={handleSubmit} pending={pending} />
          <p className="kb-auth__footer">
            Нет аккаунта? <Link to="/register">Зарегистрироваться</Link>
          </p>
        </div>
      </main>
    </div>
  )
}
