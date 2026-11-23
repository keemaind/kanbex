import { useState } from 'react'
import { AppButton, StatusBadge } from '@kanbex/ui'
import type { LearningTip } from '../../types/index.js'

export interface LearningTipsProps {
  tips: LearningTip[]
  /** Заголовок панели. */
  title?: string
}

/**
 * Обучающие подсказки: объясняют поток работы и смысл WIP-лимита.
 * Пока статический список; позже может подгружаться по контексту действия.
 */
export function LearningTips({ tips, title = 'Обучающие подсказки' }: LearningTipsProps) {
  const [openTipId, setOpenTipId] = useState<string | null>(tips[0]?.id ?? null)

  return (
    <aside className="kb-tips" aria-label={title}>
      <h2 className="kb-tips__title">{title}</h2>
      <ul className="kb-tips__list">
        {tips.map((tip) => {
          const isOpen = openTipId === tip.id
          return (
            <li key={tip.id} className="kb-tips__item">
              <button
                type="button"
                className="kb-tips__toggle"
                aria-expanded={isOpen}
                onClick={() => setOpenTipId(isOpen ? null : tip.id)}
              >
                <span>{tip.title}</span>
                <span aria-hidden="true">{isOpen ? '−' : '+'}</span>
              </button>
              {isOpen ? <p className="kb-tips__body">{tip.body}</p> : null}
            </li>
          )
        })}
      </ul>
      <div className="kb-tips__footer">
        <StatusBadge tone="info">Учебный режим</StatusBadge>
        <AppButton variant="text" size="xs" onClick={() => setOpenTipId(tips[0]?.id ?? null)}>
          С начала
        </AppButton>
      </div>
    </aside>
  )
}
