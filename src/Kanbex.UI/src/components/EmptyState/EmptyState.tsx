import type { ReactNode } from 'react'

import { AppButton } from '../AppButton/index.js'

export interface EmptyStateProps {
  /** Заголовок пустого состояния. */
  title: string
  /** Пояснение, что здесь появится и что сделать дальше. */
  description?: ReactNode
  icon?: ReactNode
  actionLabel?: string
  onAction?: () => void
  /** Дополнительное действие или ссылка. */
  secondaryAction?: ReactNode
}

/**
 * Пустое состояние списка или области: объясняет отсутствие данных и
 * предлагает следующий шаг.
 */
export function EmptyState({ title, description, icon, actionLabel, onAction, secondaryAction }: EmptyStateProps) {
  return (
    <section className="kb-empty" aria-live="polite">
      {icon ? <div className="kb-empty__icon">{icon}</div> : null}
      <h2 className="kb-empty__title">{title}</h2>
      {description ? <p className="kb-empty__description">{description}</p> : null}
      {actionLabel || secondaryAction ? (
        <div className="kb-empty__actions">
          {actionLabel ? (
            <AppButton variant="filled" onClick={onAction}>
              {actionLabel}
            </AppButton>
          ) : null}
          {secondaryAction}
        </div>
      ) : null}
    </section>
  )
}
