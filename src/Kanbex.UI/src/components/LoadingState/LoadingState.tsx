import { CircularProgressIndicator } from 'm3-expressive-react'

export interface LoadingStateProps {
  /** Текст ожидания, озвучиваемый скринридером. */
  label?: string
  /** Компактный режим для встраивания в колонку или карточку. */
  compact?: boolean
}

/** Индикация ожидания с текстом для assistive technology. */
export function LoadingState({ label = 'Загрузка…', compact = false }: LoadingStateProps) {
  return (
    <div className={compact ? 'kb-loading kb-loading--compact' : 'kb-loading'} role="status" aria-live="polite">
      <CircularProgressIndicator shape="wavy" size={compact ? 24 : 48} aria-hidden="true" />
      <span className="kb-loading__label">{label}</span>
    </div>
  )
}
