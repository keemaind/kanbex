import { Link, Outlet, useLocation, useNavigate } from 'react-router'
import { AppButton, AppHeader } from '@kanbex/ui'
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
      label: 'Мои доски',
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
        title="Kanbex"
        subtitle="Тренажёр Kanban-потока"
        logo={<span aria-hidden="true">▦</span>}
        nav={nav}
        actions={
          <>
            {user ? <span className="kb-user">{user.displayName}</span> : null}
            <AppButton
              variant="text"
              size="sm"
              onClick={() => {
                logout()
                navigate('/login')
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
        <span>Kanbex — учебный каркас приложения.</span>
        <span>
          Данные демонстрационные, API и Identity подключаются отдельным этапом. <Link to="/boards">Доски</Link>
        </span>
      </footer>
    </div>
  )
}
