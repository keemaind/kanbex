import type { ReactNode } from 'react'
import type { BadgeTone } from '../../types.js'

export interface StatusBadgeProps {
  /** Текст метки: приоритет, статус, WIP и т.п. */
  children: ReactNode
  tone?: BadgeTone
  /** Необязательная точка-индикатор слева. */
  withDot?: boolean
  title?: string
}

const toneClass: Record<BadgeTone, string> = {
  neutral: 'kb-badge--neutral',
  info: 'kb-badge--info',
  success: 'kb-badge--success',
  warning: 'kb-badge--warning',
  danger: 'kb-badge--danger',
}

/**
 * Компактная метка приоритета или статуса. Не содержит доменной логики:
 * цвет и текст задаёт вызывающая сторона.
 */
export function StatusBadge({ children, tone = 'neutral', withDot = false, title }: StatusBadgeProps) {
  return (
    <span className={`kb-badge ${toneClass[tone]}`} title={title}>
      {withDot ? <span className="kb-badge__dot" aria-hidden="true" /> : null}
      {children}
    </span>
  )
}
