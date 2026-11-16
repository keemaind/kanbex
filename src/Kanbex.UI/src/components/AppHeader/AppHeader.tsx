import type { AppHeaderProps } from '../../types.js'

/**
 * Общая верхняя панель. Навигация передаётся снаружи, поэтому компонент
 * не зависит от React Router и может использоваться в любой оболочке.
 */
export function AppHeader({ title, subtitle, logo, nav = [], actions }: AppHeaderProps) {
  return (
    <header className="kb-header">
      <div className="kb-header__brand">
        {logo ? <span className="kb-header__logo">{logo}</span> : null}
        <div className="kb-header__titles">
          <span className="kb-header__title">{title}</span>
          {subtitle ? <span className="kb-header__subtitle">{subtitle}</span> : null}
        </div>
      </div>

      {nav.length > 0 ? (
        <nav className="kb-header__nav" aria-label="Основная навигация">
          {nav.map((item) => (
            <a
              key={item.label}
              className={item.active ? 'kb-header__link kb-header__link--active' : 'kb-header__link'}
              href={item.href ?? '#'}
              aria-current={item.active ? 'page' : undefined}
              onClick={(event) => {
                if (!item.href || item.onClick) event.preventDefault()
                item.onClick?.()
              }}
            >
              {item.label}
            </a>
          ))}
        </nav>
      ) : null}

      {actions ? <div className="kb-header__actions">{actions}</div> : null}
    </header>
  )
}
