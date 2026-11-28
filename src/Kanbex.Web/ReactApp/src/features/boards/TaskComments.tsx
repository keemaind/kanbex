import { useEffect, useRef, useState } from 'react'
import type { FormEvent } from 'react'

import { AppButton, AppTextField, LoadingState } from '@kanbex/ui'

import { describeApiError } from '../../services/api.js'
import { createComment, deleteComment, fetchComments } from '../../services/boardsApi.js'

import type { Comment } from '../../types/index.js'

export interface TaskCommentsProps {
  boardId: string
  taskId: string
  /** Идентификатор текущего пользователя — автор удаляет свой комментарий. */
  currentUserId: string | null
  /** Creator может удалить любой комментарий. */
  isCreator: boolean
  /** Сообщает наверх актуальное число комментариев для счётчика на карточке. */
  onCountChange: (count: number) => void
}

const MAX_LENGTH = 4000

function formatCommentDate(iso: string): string {
  const date = new Date(iso)

  if (Number.isNaN(date.getTime())) return iso

  return date.toLocaleString('ru-RU', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  })
}

/** Комментарии карточки: список, добавление и удаление по правам. */
export function TaskComments({ boardId, taskId, currentUserId, isCreator, onCountChange }: TaskCommentsProps) {
  const [comments, setComments] = useState<Comment[] | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [reloadToken, setReloadToken] = useState(0)
  const [content, setContent] = useState('')
  const [contentError, setContentError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const onCountChangeRef = useRef(onCountChange)

  useEffect(() => {
    onCountChangeRef.current = onCountChange
  })

  useEffect(() => {
    let active = true

    setComments(null)
    setLoadError(null)
    fetchComments(boardId, taskId)
      .then((list) => {
        if (!active) return
        setComments(list)
        setLoadError(null)
        onCountChangeRef.current(list.length)
      })
      .catch((cause: unknown) => {
        if (active) setLoadError(describeApiError(cause))
      })

    return () => {
      active = false
    }
  }, [boardId, taskId, reloadToken])

  const canDelete = (comment: Comment): boolean =>
    comment.authorId === currentUserId || isCreator

  const handleSubmit = async (event?: FormEvent<HTMLFormElement>) => {
    event?.preventDefault()

    const trimmed = content.trim()

    if (trimmed.length === 0) {
      setContentError('Введите текст комментария.')

      return
    }

    setContentError(null)
    setSubmitting(true)

    try {
      const created = await createComment(boardId, taskId, trimmed)

      setComments((current) => {
        const next = current ? [...current, created] : [created]

        onCountChangeRef.current(next.length)

        return next
      })
      setContent('')
    } catch (cause) {
      setContentError(describeApiError(cause))
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (comment: Comment) => {
    setDeletingId(comment.id)

    try {
      await deleteComment(boardId, taskId, comment.id)
      setComments((current) => {
        const next = current ? current.filter((item) => item.id !== comment.id) : []

        onCountChangeRef.current(next.length)

        return next
      })
    } catch (cause) {
      setContentError(describeApiError(cause))
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div className="kb-comments">
      {loadError ? (
        <div className="kb-comments__state" role="status">
          <p className="kb-comments__error" role="alert">{loadError}</p>
          <AppButton
            variant="tonal"
            size="sm"
            onClick={() => setReloadToken((token) => token + 1)}
          >
            Повторить
          </AppButton>
        </div>
      ) : comments === null ? (
        <LoadingState compact label="Загружаем комментарии…" />
      ) : comments.length === 0 ? (
        <p className="kb-comments__state">
          Комментариев пока нет. Уточните требование или задайте вопрос участникам.
        </p>
      ) : (
        <ul className="kb-comments__list" aria-live="polite">
          {comments.map((comment) => (
            <li key={comment.id} className="kb-comments__item">
              <div className="kb-comments__head">
                <span className="kb-comments__author">{comment.authorName}</span>
                <span className="kb-comments__date">{formatCommentDate(comment.createdAt)}</span>
                {canDelete(comment) ? (
                  <button
                    type="button"
                    className="kb-comments__delete"
                    disabled={deletingId !== null}
                    aria-label={`Удалить комментарий от ${comment.authorName}`}
                    onClick={() => void handleDelete(comment)}
                  >
                    Удалить
                  </button>
                ) : null}
              </div>
              <p className="kb-comments__text">{comment.content}</p>
            </li>
          ))}
        </ul>
      )}

      <form
        className="kb-comments__form"
        onSubmit={(event) => void handleSubmit(event)}
      >
        <AppTextField
          label="Новый комментарий"
          name="commentContent"
          value={content}
          onChange={(event) => {
            setContent(event.target.value)
            if (contentError) setContentError(null)
          }}
          error={Boolean(contentError)}
          errorText={contentError ?? undefined}
          supportingText={`От 1 до ${MAX_LENGTH} символов.`}
          multiline
          rows={2}
          maxLength={MAX_LENGTH}
        />
        <AppButton type="submit" variant="filled" size="sm" disabled={submitting}>
          Отправить
        </AppButton>
      </form>
    </div>
  )
}
