import { useEffect, useState } from 'react'
import type { CSSProperties, FormEvent } from 'react'
import { AppButton, AppDialog, AppTextField, LoadingState } from '@kanbex/ui'
import { createTag, deleteTag, fetchTags, updateTag } from '../../services/boardsApi.js'
import { describeApiError } from '../../services/api.js'
import type { Tag } from '../../types/index.js'
import { TagColorPicker } from './TagColorPicker.js'

export interface TagManagerDialogProps {
  boardId: string
  /** Сообщает наверх об изменении тега, чтобы карточки обновились сразу. */
  onTagUpdated?: (tag: Tag) => void
  /** Сообщает наверх об удалении тега, чтобы карточки обновились сразу. */
  onTagDeleted?: (tagId: string) => void
  onClose: () => void
}

const DEFAULT_COLOR = '#6252E8'

/**
 * Каталог тегов доски (только Creator): создание, переименование, цвет
 * и удаление. Цвет выбирается из готовых пресетов; удаление требует
 * повторного подтверждения в строке.
 */
export function TagManagerDialog({ boardId, onTagUpdated, onTagDeleted, onClose }: TagManagerDialogProps) {
  const [tags, setTags] = useState<Tag[] | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [newName, setNewName] = useState('')
  const [newColor, setNewColor] = useState(DEFAULT_COLOR)
  const [creating, setCreating] = useState(false)
  const [editingTagId, setEditingTagId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')
  const [editColor, setEditColor] = useState(DEFAULT_COLOR)
  const [savingTagId, setSavingTagId] = useState<string | null>(null)
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null)

  useEffect(() => {
    let active = true

    fetchTags(boardId)
      .then((list) => {
        if (active) {
          setTags(list)
          setLoadError(null)
        }
      })
      .catch((cause: unknown) => {
        if (active) setLoadError(describeApiError(cause))
      })

    return () => {
      active = false
    }
  }, [boardId])

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
      setTags((current) => (current ? [...current, created] : [created]))
      setNewName('')
      setNewColor(DEFAULT_COLOR)
    } catch (cause) {
      setError(describeApiError(cause))
    } finally {
      setCreating(false)
    }
  }

  const startEdit = (tag: Tag) => {
    setEditingTagId(tag.id)
    setEditName(tag.name)
    setEditColor(tag.color)
    setError(null)
    setPendingDeleteId(null)
  }

  const handleSaveEdit = async (tag: Tag) => {
    const name = editName.trim()
    if (name.length === 0 || name.length > 64) {
      setError('Имя тега — от 1 до 64 символов.')
      return
    }

    setSavingTagId(tag.id)
    setError(null)
    try {
      const updated = await updateTag(boardId, tag.id, name, editColor)
      setTags((current) => (current ? current.map((item) => (item.id === tag.id ? updated : item)) : current))
      setEditingTagId(null)
      onTagUpdated?.(updated)
    } catch (cause) {
      setError(describeApiError(cause))
    } finally {
      setSavingTagId(null)
    }
  }

  const handleDelete = async (tag: Tag) => {
    setSavingTagId(tag.id)
    setError(null)
    try {
      await deleteTag(boardId, tag.id)
      setTags((current) => (current ? current.filter((item) => item.id !== tag.id) : current))
      setPendingDeleteId(null)
      onTagDeleted?.(tag.id)
    } catch (cause) {
      setError(describeApiError(cause))
    } finally {
      setSavingTagId(null)
    }
  }

  return (
    <AppDialog
      open
      className="kb-dialog--wide"
      title="Теги доски"
      description="Каталог тегов общий для всех карточек доски. Удаление тега снимает его со всех карточек."
      confirmLabel="Готово"
      cancelLabel={null}
      onConfirm={onClose}
      onCancel={onClose}
    >
      <div className="kb-tag-manager">
        <form className="kb-tag-manager__create" onSubmit={(event) => void handleCreate(event)}>
          <div className="kb-tag-manager__create-row">
            <AppTextField
              className="kb-tag-manager__name"
              label="Новый тег"
              name="tagName"
              value={newName}
              onChange={(event) => setNewName(event.target.value)}
              maxLength={64}
              supportingText="Имя — до 64 символов."
            />
            <TagColorPicker value={newColor} onChange={setNewColor} />
            <AppButton type="submit" variant="filled" size="sm" disabled={creating}>
              Создать
            </AppButton>
          </div>
        </form>

        {error ? <p className="kb-tag-manager__error" role="alert">{error}</p> : null}

        {tags === null && !loadError ? (
          <LoadingState compact label="Загружаем теги…" />
        ) : null}
        {loadError ? <p className="kb-tag-manager__state kb-tag-manager__state--error">{loadError}</p> : null}
        {tags !== null && tags.length === 0 ? (
          <p className="kb-tag-manager__state">Каталог пуст — создайте первый тег.</p>
        ) : null}

        {tags !== null && tags.length > 0 ? (
          <ul className="kb-tag-manager__list">
            {tags.map((tag) => {
              const editing = editingTagId === tag.id
              const deleting = pendingDeleteId === tag.id

              return (
                <li key={tag.id} className="kb-tag-manager__item">
                  {editing ? (
                    <form
                      className="kb-tag-manager__edit"
                      onSubmit={(event) => {
                        event.preventDefault()
                        void handleSaveEdit(tag)
                      }}
                    >
                      <div className="kb-tag-manager__edit-row">
                        <AppTextField
                          className="kb-tag-manager__name"
                          label="Имя тега"
                          name="tagName"
                          value={editName}
                          onChange={(event) => setEditName(event.target.value)}
                          maxLength={64}
                        />
                        <TagColorPicker value={editColor} onChange={setEditColor} />
                        <AppButton type="submit" variant="filled" size="sm" disabled={savingTagId !== null}>
                          Сохранить
                        </AppButton>
                        <AppButton
                          variant="text"
                          size="sm"
                          onClick={() => {
                            setEditingTagId(null)
                            setError(null)
                          }}
                        >
                          Отмена
                        </AppButton>
                      </div>
                    </form>
                  ) : (
                    <>
                      <span
                        className="kb-tag-manager__dot"
                        style={{ '--kb-tag-color': tag.color } as CSSProperties}
                        aria-hidden="true"
                      />
                      <span className="kb-tag-manager__title">{tag.name}</span>
                      {deleting ? (
                        <span className="kb-tag-manager__confirm">
                          Удалить тег?
                          <AppButton variant="text" size="sm" disabled={savingTagId !== null} onClick={() => void handleDelete(tag)}>
                            Да
                          </AppButton>
                          <AppButton variant="text" size="sm" onClick={() => setPendingDeleteId(null)}>
                            Нет
                          </AppButton>
                        </span>
                      ) : (
                        <span className="kb-tag-manager__actions">
                          <AppButton variant="text" size="sm" onClick={() => startEdit(tag)}>
                            Изменить
                          </AppButton>
                          <AppButton variant="text" size="sm" onClick={() => setPendingDeleteId(tag.id)}>
                            Удалить
                          </AppButton>
                        </span>
                      )}
                    </>
                  )}
                </li>
              )
            })}
          </ul>
        ) : null}
      </div>
    </AppDialog>
  )
}
