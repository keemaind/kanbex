import { useState } from 'react'
import { Outlet, useLocation, useNavigate } from 'react-router'
import {
  AppIconButton,
  AppNavigationRail,
  AppNavigationRailAction,
  AppNavigationRailItem,
} from '@kanbex/ui'
import { useAuth } from '../features/auth/index.js'
import { getInitials } from './avatar.js'
import { FolderIcon, HomeIcon, InfoIcon, MenuIcon, MenuOpenIcon, SettingsIcon } from './icons.js'

const destinations = [
  { value: 'home', label: 'Главная', path: '/home', icon: <HomeIcon /> },
  { value: 'projects', label: 'Проекты', path: '/boards', icon: <FolderIcon /> },
  { value: 'about', label: 'Kanbex', path: '/about', icon: <InfoIcon /> },
  { value: 'settings', label: 'Настройки', path: '/settings', icon: <SettingsIcon /> },
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
  if (pathname === '/settings') return 'settings'
  return ''
}

/**
 * Оболочка главного экрана: боковая навигационная панель (rail) и область
 * контента. Пункты меню идут сверху вниз, компактный знак Kanbex и кнопка
 * меню закреплены в шапке рельсы — кнопка разворачивает и сворачивает
 * пункты с подписями.
 */
export function MainMenuLayout() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const avatarUrl = user?.avatarUrl ?? null
  const active = getActiveDestination(pathname)
  const [expanded, setExpanded] = useState(false)

  return (
    <div className="kb-menu">
      <AppNavigationRail
        id="kb-main-rail"
        className="kb-menu__rail"
        variant={expanded ? 'expanded' : 'collapsed'}
        arrangement="top"
        value={active}
        aria-label="Главное меню"
        header={
          <div className="kb-menu__rail-header">
            <AppIconButton
              variant="standard"
              size="sm"
              icon={expanded ? <MenuOpenIcon /> : <MenuIcon />}
              aria-label={expanded ? 'Свернуть меню' : 'Развернуть меню'}
              aria-expanded={expanded}
              aria-controls="kb-main-rail"
              onClick={() => setExpanded((current) => !current)}
            />
          </div>
        }
      >
        {destinations.map((destination) => (
          <AppNavigationRailItem
            key={destination.value}
            value={destination.value}
            icon={destination.icon}
            label={destination.label}
            onClick={() => navigate(destination.path)}
          />
        ))}
        {user ? (
          <AppNavigationRailAction
            className="kb-menu__rail-user"
            icon={
              avatarUrl ? (
                <img className="kb-menu__avatar-image" src={avatarUrl} alt="" />
              ) : (
                <span className="kb-menu__avatar" aria-hidden="true">
                  {getInitials(user.displayName)}
                </span>
              )
            }
            label={user.displayName}
            aria-label={`Профиль: ${user.displayName}`}
            onClick={() => navigate('/profile')}
          />
        ) : null}
      </AppNavigationRail>

      <main className="kb-menu__content">
        <Outlet />
      </main>
    </div>
  )
}
