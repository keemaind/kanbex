import { useEffect, useState } from 'react'
import type { CSSProperties, FormEvent } from 'react'

import { AppButton, AppTextField, LoadingState } from '@kanbex/ui'

import { TagColorPicker } from './TagColorPicker.js'
import { describeApiError } from '../../services/api.js'
import { createTag, fetchTags, setTaskTags } from '../../services/boardsApi.js'

import type { Tag, TaskCard } from '../../types/index.js'

export interface TagPickerProps {
  boardId: string
  task: TaskCard
  /** Creator может создавать новые теги каталога прямо из пикера. */
  isCreator: boolean
  onTagsChange: (tags: Tag[]) => void
}

const DEFAULT_COLOR = '#6252E8'

/** Выбор тегов карточки: клик по чипу прикрепляет или открепляет тег. */
export function TagPicker({ boardId, task, isCreator, onTagsChange }: TagPickerProps) {
  const [catalog, setCatalog] = useState<Tag[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [busyTagId, setBusyTagId] = useState<string | null>(null)
  const [newName, setNewName] = useState('')
  const [newColor, setNewColor] = useState(DEFAULT_COLOR)
  const [creating, setCreating] = useState(false)

  useEffect(() => {
    let active = true

    fetchTags(boardId)
      .then((list) => {
        if (active) {
          setCatalog(list)
          setError(null)
        }
      })
      .catch((cause: unknown) => {
        if (active) setError(describeApiError(cause))
      })

    return () => {
      active = false
    }
  }, [boardId])

  const selectedIds = new Set((task.tags ?? []).map((tag) => tag.id))

  const handleToggle = async (tag: Tag) => {
    if (busyTagId) return

    const nextIds = new Set(selectedIds)

    if (nextIds.has(tag.id)) {
      nextIds.delete(tag.id)
    } else {
      nextIds.add(tag.id)
    }

    setBusyTagId(tag.id)
    setError(null)

    try {
      const next = await setTaskTags(boardId, task.id, [...nextIds])

      onTagsChange(next)
    } catch (cause) {
      setError(describeApiError(cause))
    } finally {
      setBusyTagId(null)
    }
  }

  const handleCreate = async (event?: FormEvent<HTMLFormElement>) => {
    event?.preventDefault()

    const name = newName.trim()

    if (name.length === 0 || name.length > 64) {
      setError('Имя тега — от 1 до 64 символов.')

      return
    }

    setCreating(true)
    setError(null)

    try {
      const created = await createTag(boardId, name, newColor)

      setCatalog((current) => (current ? [...current, created] : [created]))
      setNewName('')
      setNewColor(DEFAULT_COLOR)
      const next = await setTaskTags(boardId, task.id, [...selectedIds, created.id])

      onTagsChange(next)
    } catch (cause) {
      setError(describeApiError(cause))
    } finally {
      setCreating(false)
    }
  }

  return (
    <div className="kb-tag-picker">
      {error ? (
        <p className="kb-tag-picker__error" role="alert">{error}</p>
      ) : null}

      {catalog === null ? (
        <LoadingState compact label="Загружаем теги доски…" />
      ) : catalog.length === 0 ? (
        <p className="kb-tag-picker__state">
          В каталоге доски пока нет тегов.
          {isCreator ? ' Создайте первый тег ниже.' : ' Попросите владельца доски создать теги.'}
        </p>
      ) : (
        <div className="kb-tag-picker__chips">
          {catalog.map((tag) => {
            const selected = selectedIds.has(tag.id)

            return (
              <button
                key={tag.id}
                type="button"
                className={selected ? 'kb-tag-picker__chip kb-tag-picker__chip--selected' : 'kb-tag-picker__chip'}
                style={{ '--kb-tag-color': tag.color } as CSSProperties}
                aria-pressed={selected}
                disabled={busyTagId !== null}
                onClick={() => void handleToggle(tag)}
              >
                {tag.name}
              </button>
            )
          })}
        </div>
      )}

      {isCreator ? (
        <form className="kb-tag-picker__form" onSubmit={(event) => void handleCreate(event)}>
          <div className="kb-tag-picker__form-row">
            <AppTextField
              className="kb-tag-picker__name"
              label="Новый тег"
              name="tagName"
              value={newName}
              onChange={(event) => setNewName(event.target.value)}
              maxLength={64}
              supportingText="Имя — до 64 символов."
            />
            <TagColorPicker value={newColor} onChange={setNewColor} />
            <AppButton type="submit" variant="tonal" size="sm" disabled={creating}>
              Создать
            </AppButton>
          </div>
        </form>
      ) : null}
    </div>
  )
}
