import { useState } from 'react'
import { Link, Outlet, useLocation, useNavigate } from 'react-router'
import {
  AppIconButton,
  AppNavigationDrawer,
  AppNavigationDrawerItem,
  KanbexLogo,
} from '@kanbex/ui'
import { useAuth } from '../features/auth/index.js'
import {
  ChevronDownIcon,
  FolderIcon,
  HomeIcon,
  InfoIcon,
  SettingsIcon,
  SidebarIcon,
} from './icons.js'

const destinations = [
  { value: 'home', label: 'Главная', path: '/home', icon: <HomeIcon /> },
  { value: 'projects', label: 'Проекты', path: '/boards', icon: <FolderIcon /> },
  { value: 'about', label: 'О нас', path: '/about', icon: <InfoIcon /> },
  { value: 'settings', label: 'Настройки', path: '/account', icon: <SettingsIcon /> },
] as const

function getActiveDestination(pathname: string): string {
  if (pathname === '/home') return 'home'
  if (
    pathname === '/boards' ||
    pathname === '/board' ||
    pathname.startsWith('/boards/') ||
    pathname.startsWith('/board/')
  ) {
    return 'projects'
  }
  if (pathname === '/about') return 'about'
  if (pathname === '/account') return 'settings'
  return ''
}

function getInitials(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('') || 'K'
}

/**
 * Оболочка главного экрана: постоянное боковое меню и область контента.
 * Пункты меню повторяют основную навигацию приложения.
 */
export function MainMenuLayout() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const [open, setOpen] = useState(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return true
    return window.matchMedia('(min-width: 961px)').matches
  })
  const active = getActiveDestination(pathname)

  const closeOnMobile = () => {
    if (
      typeof window !== 'undefined' &&
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(max-width: 960px)').matches
    ) {
      setOpen(false)
    }
  }

  return (
    <div className="kb-menu">
      <AppNavigationDrawer
        id="kb-main-menu"
        className="kb-menu__drawer"
        variant="dismissible"
        open={open}
        onClose={() => setOpen(false)}
        value={active}
        aria-label="Главное меню"
      >
        <div className="kb-menu__brand-row">
          <Link
            className="kb-menu__brand"
            to="/home"
            aria-label="Kanbex — на главную"
            onClick={closeOnMobile}
          >
            <KanbexLogo height={30} />
          </Link>
          <AppIconButton
            className="kb-menu__toggle"
            variant="standard"
            size="xs"
            icon={<SidebarIcon />}
            aria-label="Скрыть боковое меню"
            aria-expanded={open}
            aria-controls="kb-main-menu"
            onClick={() => setOpen(false)}
          />
        </div>

        <nav className="kb-menu__nav" aria-label="Разделы">
          {destinations.map((destination) => (
            <AppNavigationDrawerItem
              key={destination.value}
              value={destination.value}
              icon={destination.icon}
              label={destination.label}
              onClick={() => {
                navigate(destination.path)
                closeOnMobile()
              }}
            />
          ))}
        </nav>

        <div className="kb-menu__spacer" />

        {user ? (
          <button
            type="button"
            className="kb-menu__user"
            onClick={() => {
              navigate('/account')
              closeOnMobile()
            }}
          >
            <span className="kb-menu__avatar" aria-hidden="true">{getInitials(user.displayName)}</span>
            <span className="kb-menu__user-text">
              <span className="kb-menu__user-name">{user.displayName}</span>
              <span className="kb-menu__user-email">{user.email}</span>
            </span>
            <span className="kb-menu__chevron" aria-hidden="true">
              <ChevronDownIcon />
            </span>
          </button>
        ) : null}
      </AppNavigationDrawer>

      <main className="kb-menu__content">
        <div className="kb-menu__toolbar">
          {!open ? (
            <AppIconButton
              variant="standard"
              size="sm"
              icon={<SidebarIcon />}
              aria-label="Показать боковое меню"
              aria-expanded={false}
              aria-controls="kb-main-menu"
              onClick={() => setOpen(true)}
            />
          ) : null}
        </div>
        <Outlet />
      </main>
    </div>
  )
}
