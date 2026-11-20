import { Link, useNavigate } from 'react-router'
import { AppButton, EmptyState, StatusBadge } from '@kanbex/ui'
import { useAuth } from '../features/auth/index.js'

/**
 * Страница профиля. Заглушка: покажет данные пользователя и будущие
 * настройки (смена имени, выход, удаление аккаунта).
 */
export function AccountPage() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  if (!user) {
    return (
      <div className="kb-page">
        <EmptyState
          title="Требуется вход"
          description="Профиль доступен только аутентифицированному пользователю."
          actionLabel="Войти"
          onAction={() => navigate('/login')}
        />
      </div>
    )
  }

  return (
    <div className="kb-page">
      <div className="kb-page__head">
        <div>
          <h1 className="kb-page__title">Учётная запись</h1>
          <p className="kb-page__lead">
            Данные получены из <code>GET /api/auth/me</code>. Смена имени и пароля появится
            отдельным этапом.
          </p>
        </div>
        <StatusBadge tone="success" withDot>
          Сессия активна
        </StatusBadge>
      </div>

      <dl className="kb-profile">
        <div className="kb-profile__row">
          <dt>Имя</dt>
          <dd>{user.displayName}</dd>
        </div>
        <div className="kb-profile__row">
          <dt>E-mail</dt>
          <dd>{user.email}</dd>
        </div>
        <div className="kb-profile__row">
          <dt>Идентификатор</dt>
          <dd>
            <code>{user.id}</code>
          </dd>
        </div>
        <div className="kb-profile__row">
          <dt>Аутентификация</dt>
          <dd>ASP.NET Core Identity, cookie-сессия <code>Kanbex.Auth</code>.</dd>
        </div>
      </dl>

      <div className="kb-page__actions">
        <Link to="/boards" className="kb-link-button">
          К доскам
        </Link>
        <AppButton
          variant="outlined"
          size="sm"
          onClick={() => {
            void logout().then(() => navigate('/login', { replace: true }))
          }}
        >
          Выйти
        </AppButton>
      </div>
    </div>
  )
}
