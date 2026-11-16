import type { ReactNode } from 'react'

/** Визуальный тон метки статуса или приоритета. */
export type BadgeTone = 'neutral' | 'info' | 'success' | 'warning' | 'danger'

/** Общее описание пункта навигации для верхней панели. */
export interface AppHeaderNavItem {
  label: string
  href?: string
  onClick?: () => void
  active?: boolean
}

/** Действие в пустом состоянии. */
export interface EmptyStateAction {
  label: string
  onClick?: () => void
  href?: string
}

/** Пропсы общей верхней панели приложения. */
export interface AppHeaderProps {
  title: string
  subtitle?: string
  /** Слот для логотипа или иконки. */
  logo?: ReactNode
  nav?: AppHeaderNavItem[]
  /** Дополнительные действия справа (кнопки, меню пользователя). */
  actions?: ReactNode
}

export type { ReactNode }
