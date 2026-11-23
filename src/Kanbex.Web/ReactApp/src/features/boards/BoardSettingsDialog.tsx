import { useState } from 'react'
import type { FormEvent } from 'react'
import { AppDialog, AppTextField } from '@kanbex/ui'
import type { Board } from '../../types/index.js'
import { BoardMembersSection } from './BoardMembersSection.js'
import { ShareBoardSection } from './ShareBoardSection.js'

export interface BoardDetailsValues {
  title: string
  description: string
}

export interface BoardSettingsDialogProps {
  board: Board
  /** Сохраняет название и описание (на сервере доступно только Creator). */
  onSave: (values: BoardDetailsValues) => void
  /** Переключает публичность доски отдельным endpoint-ом. */
  onVisibilityChange: (isPublic: boolean) => Promise<void>
  onClose: () => void
}

/**
 * Единое окно настроек доски: название и описание, участники и публичная
 * ссылка. Кнопка «Сохранить» применяет название/описание; участники и
 * шаринг работают сразу.
 */
export function BoardSettingsDialog({ board, onSave, onVisibilityChange, onClose }: BoardSettingsDialogProps) {
  const [nextTitle, setNextTitle] = useState(board.title)
  const [nextDescription, setNextDescription] = useState(board.description)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = (event?: FormEvent<HTMLFormElement>) => {
    event?.preventDefault()

    const trimmedTitle = nextTitle.trim()
    if (trimmedTitle.length < 2) {
      setError('Название доски должно содержать минимум 2 символа.')
      return
    }

    setError(null)
    onSave({ title: trimmedTitle, description: nextDescription.trim() })
  }

  return (
    <AppDialog
      open
      className="kb-dialog--wide"
      title="Настройки проекта"
      description="Название и описание видны в списке проектов и в шапке доски; участники и публичная ссылка настраиваются здесь же."
      confirmLabel="Сохранить"
      onConfirm={() => handleSubmit()}
      onCancel={onClose}
    >
      <div className="kb-board-settings">
        <section className="kb-settings-section" aria-labelledby="kb-settings-general-title">
          <h3 className="kb-settings-section__title" id="kb-settings-general-title">
            Основное
          </h3>
          <form className="kb-form" onSubmit={handleSubmit}>
            <AppTextField
              label="Название доски"
              name="boardTitle"
              value={nextTitle}
              onChange={(event) => {
                setNextTitle(event.target.value)
                if (error) setError(null)
              }}
              error={Boolean(error)}
              errorText={error ?? undefined}
              maxLength={120}
              required
            />
            <AppTextField
              label="Описание"
              name="boardDescription"
              value={nextDescription}
              onChange={(event) => setNextDescription(event.target.value)}
              supportingText="Необязательно: одной строкой о цели доски."
              multiline
              rows={3}
              maxLength={4000}
            />
          </form>
        </section>

        <section className="kb-settings-section" aria-labelledby="kb-settings-members-title">
          <h3 className="kb-settings-section__title" id="kb-settings-members-title">
            Участники
          </h3>
          <BoardMembersSection boardId={board.id} />
        </section>

        <section className="kb-settings-section" aria-labelledby="kb-settings-share-title">
          <h3 className="kb-settings-section__title" id="kb-settings-share-title">
            Поделиться
          </h3>
          <ShareBoardSection
            boardId={board.id}
            isPublic={board.isPublic}
            onVisibilityChange={onVisibilityChange}
          />
        </section>
      </div>
    </AppDialog>
  )
}
