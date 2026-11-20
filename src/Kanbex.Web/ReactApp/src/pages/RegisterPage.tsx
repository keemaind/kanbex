import { useState } from 'react'
import { Link, useNavigate } from 'react-router'
import { AppHeader, KanbexLogo } from '@kanbex/ui'
import { RegisterForm, useAuth } from '../features/auth/index.js'
import { describeApiError } from '../services/api.js'
import type { RegisterRequest } from '../types/index.js'

/**
 * Страница регистрации. `POST /api/auth/register` создаёт учётную запись
 * Identity и сразу открывает cookie-сессию.
 */
export function RegisterPage() {
  const { register, pending } = useAuth()
  const navigate = useNavigate()
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (request: RegisterRequest) => {
    setError(null)
    try {
      await register(request)
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
          <h1 className="kb-auth__title">Регистрация</h1>
          <p className="kb-auth__lead">
            Создайте аккаунт Kanbex. Пароль — не короче шести символов, с цифрой и строчной буквой.
          </p>
          <RegisterForm onSubmit={handleSubmit} pending={pending} error={error} />
          <p className="kb-auth__footer">
            Уже есть аккаунт? <Link to="/login">Войти</Link>
          </p>
        </div>
      </main>
    </div>
  )
}
