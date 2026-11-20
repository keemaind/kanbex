import { Link, Outlet, useLocation, useNavigate } from 'react-router'
import { AppButton, AppHeader, KanbexLogo } from '@kanbex/ui'
import type { AppHeaderNavItem } from '@kanbex/ui'
import { useAuth } from '../features/auth/index.js'

/**
 * Оболочка защищённых страниц: общая панель, навигация и подвал.
 * Ссылки проксируются в React Router, поэтому переходы не перезагружают SPA.
 */
export function AppLayout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const { pathname } = useLocation()

  const nav: AppHeaderNavItem[] = [
    {
      label: 'Проекты',
      href: '/boards',
      active: pathname === '/boards' || pathname.startsWith('/boards/') || pathname === '/board' || pathname.startsWith('/board/'),
      onClick: () => navigate('/boards'),
    },
    {
      label: 'Учётная запись',
      href: '/account',
      active: pathname === '/account',
      onClick: () => navigate('/account'),
    },
  ]

  return (
    <div className="kb-app">
      <AppHeader
        subtitle="Тренажёр Kanban-потока"
        logo={<KanbexLogo height={30} />}
        nav={nav}
        actions={
          <>
            {user ? <span className="kb-user">{user.displayName}</span> : null}
            <AppButton
              variant="text"
              size="sm"
              onClick={() => {
                void logout().then(() => navigate('/login', { replace: true }))
              }}
            >
              Выйти
            </AppButton>
          </>
        }
      />

      <main className="kb-main">
        <Outlet />
      </main>

      <footer className="kb-footer">
        <span>Kanbex — учебный тренажёр Kanban-потока.</span>
        <span>
          Доски хранятся в браузере, доступ к сессии — через ASP.NET Core Identity.{' '}
          <Link to="/boards">Проекты</Link>
        </span>
      </footer>
    </div>
  )
}
