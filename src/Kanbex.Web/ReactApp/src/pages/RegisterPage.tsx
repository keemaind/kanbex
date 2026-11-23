import { Link, useNavigate } from 'react-router'
import { AppHeader, KanbexLogo } from '@kanbex/ui'
import { RegisterForm, useAuth } from '../features/auth/index.js'
import type { RegisterRequest } from '../types/index.js'

/**
 * Страница регистрации. В будущем — Identity UI или `POST /api/auth/register`
 * с последующим созданием cookie-сессии.
 */
export function RegisterPage() {
  const { register, pending } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (request: RegisterRequest) => {
    await register(request)
    navigate('/boards')
  }

  return (
    <div className="kb-auth-page">
      <AppHeader subtitle="Тренажёр Kanban-потока" logo={<KanbexLogo height={30} />} />
      <main className="kb-auth">
        <div className="kb-auth__card">
          <h1 className="kb-auth__title">Регистрация</h1>
          <p className="kb-auth__lead">
            Учебная форма каркаса: учётная запись хранится только в текущей сессии браузера.
          </p>
          <RegisterForm onSubmit={handleSubmit} pending={pending} />
          <p className="kb-auth__footer">
            Уже есть аккаунт? <Link to="/login">Войти</Link>
          </p>
        </div>
      </main>
    </div>
  )
}
