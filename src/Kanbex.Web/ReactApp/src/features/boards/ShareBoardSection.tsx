import { useEffect, useState } from 'react'
import { AppButton, AppSwitch, StatusBadge } from '@kanbex/ui'
import { describeApiError } from '../../services/api.js'

export interface ShareBoardSectionProps {
  boardId: string
  isPublic: boolean
  /** Переключает видимость на сервере; обновляет локальное состояние доски. */
  onVisibilityChange: (isPublic: boolean) => Promise<void>
}

/** Секция «Поделиться»: переключатель публичности и копирование ссылки. */
export function ShareBoardSection({ boardId, isPublic, onVisibilityChange }: ShareBoardSectionProps) {
  const [checked, setChecked] = useState(isPublic)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    setChecked(isPublic)
  }, [isPublic])

  const shareUrl = `${window.location.origin}/share/${boardId}`

  const handleToggle = async (selected: boolean) => {
    if (busy || selected === checked) return

    setBusy(true)
    setError(null)
    setCopied(false)
    try {
      await onVisibilityChange(selected)
      setChecked(selected)
    } catch (cause) {
      setError(describeApiError(cause))
    } finally {
      setBusy(false)
    }
  }

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl)
      setCopied(true)
      setError(null)
    } catch {
      setError('Не удалось скопировать автоматически — выделите ссылку и скопируйте вручную.')
    }
  }

  return (
    <div className="kb-share">
      <label className="kb-share__switch">
        <span className="kb-share__switch-text">
          <span className="kb-share__switch-title">Публичная доска</span>
          <span className="kb-share__switch-hint">
            {checked ? 'Ссылка ниже работает для всех' : 'Ссылка будет недоступна, пока доска приватная'}
          </span>
        </span>
        <AppSwitch
          selected={checked}
          disabled={busy}
          aria-label="Публичная доска"
          onChange={(_, selected) => void handleToggle(selected)}
        />
      </label>

      <div className="kb-share__link">
        <input
          className="kb-share__link-input"
          type="text"
          readOnly
          value={shareUrl}
          aria-label="Ссылка на публичную доску"
          onFocus={(event) => event.target.select()}
        />
        <AppButton variant="tonal" size="sm" onClick={() => void handleCopy()}>
          Скопировать
        </AppButton>
      </div>

      <div className="kb-share__status" role="status" aria-live="polite">
        {error ? (
          <StatusBadge tone="danger" withDot>
            {error}
          </StatusBadge>
        ) : copied ? (
          <StatusBadge tone="success" withDot>
            Ссылка скопирована.
          </StatusBadge>
        ) : null}
      </div>
    </div>
  )
}
