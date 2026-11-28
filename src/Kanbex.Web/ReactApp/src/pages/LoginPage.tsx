import { useState } from 'react'

import { Link, useNavigate } from 'react-router'

import { KanbexLogo, StatusBadge } from '@kanbex/ui'

import { ExpressiveShape } from '../app/expressiveShapes.js'
import { LoginForm, useAuth } from '../features/auth/index.js'
import { describeApiError } from '../services/api.js'

import type { LoginRequest } from '../types/index.js'

/**
 * Страница входа: брендовая панель слева и форма справа. Форма обращается
 * к `POST /api/auth/login`; сервер открывает cookie-сессию, после чего
 * клиентский guard пускает к доскам.
 */
export function LoginPage() {
  const { login, pending, user } = useAuth()
  const navigate = useNavigate()
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (request: LoginRequest) => {
    setError(null)

    try {
      await login(request)
      navigate('/home', { replace: true })
    } catch (submitError) {
      setError(describeApiError(submitError))
    }
  }

  return (
    <div className="kb-auth-page kb-auth-page--split">
      <aside className="kb-auth__aside">
        <div className="kb-auth__aside-inner">
          <KanbexLogo height={48} />
          <p className="kb-auth__aside-title">Kanban-симулятор</p>
          <p className="kb-auth__aside-text">
            Колонки, WIP-лимиты и живой поток задач — заметайте перегрузку до того,
            как она съест дедлайн.
          </p>
          <ExpressiveShape name="softBurst" className="kb-auth__shape kb-auth__shape--1" />
          <ExpressiveShape name="cookie9" className="kb-auth__shape kb-auth__shape--2" />
        </div>
      </aside>

      <main className="kb-auth">
        <div className="kb-auth__card">
          <h1 className="kb-auth__title">С возвращением!</h1>
          <p className="kb-auth__lead">
            Войдите в аккаунт Kanbex. Демо-доступ: <code>student@kanbex.local</code> /{' '}
            <code>Student1</code>.
          </p>
          {user ? (
            <p className="kb-auth__note">
              <StatusBadge tone="success" withDot>
                Вы уже вошли как {user.displayName}
              </StatusBadge>{' '}
              <Link to="/home">Перейти на главную</Link>
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
