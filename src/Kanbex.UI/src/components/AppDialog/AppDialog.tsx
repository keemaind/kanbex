import type { ReactNode } from 'react'
import { AppButton } from '../AppButton/index.js'

export interface AppDialogProps {
  open: boolean
  title: string
  description?: ReactNode
  /** Содержимое диалога между заголовком и действиями. */
  children?: ReactNode
  /** Подпись кнопки подтверждения. */
  confirmLabel?: string
  /** Подпись кнопки отмены; `null` скрывает её. */
  cancelLabel?: string | null
  /** Тон подтверждающего действия. */
  confirmVariant?: 'filled' | 'tonal' | 'text'
  onConfirm?: () => void
  onCancel: () => void
  busy?: boolean
}

/**
 * Простой модальный диалог подтверждения или информирования на основе
 * собственной разметки: библиотека не тянет fetch, роутер или доменные правила.
 */
export function AppDialog({
  open,
  title,
  description,
  children,
  confirmLabel = 'Подтвердить',
  cancelLabel = 'Отмена',
  confirmVariant = 'filled',
  onConfirm,
  onCancel,
  busy = false,
}: AppDialogProps) {
  if (!open) return null

  return (
    <div
      className="kb-dialog__scrim"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !busy) onCancel()
      }}
    >
      <div
        className="kb-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="kb-dialog-title"
        onKeyDown={(event) => {
          if (event.key === 'Escape' && !busy) onCancel()
        }}
      >
        <h2 className="kb-dialog__title" id="kb-dialog-title">
          {title}
        </h2>
        {description ? <div className="kb-dialog__description">{description}</div> : null}
        {children ? <div className="kb-dialog__body">{children}</div> : null}
        <div className="kb-dialog__actions">
          {cancelLabel ? (
            <AppButton variant="text" onClick={onCancel} disabled={busy}>
              {cancelLabel}
            </AppButton>
          ) : null}
          <AppButton variant={confirmVariant} onClick={onConfirm} disabled={busy}>
            {busy ? 'Выполняется…' : confirmLabel}
          </AppButton>
        </div>
      </div>
    </div>
  )
}
