import { useEffect, useState } from 'react'

import { Link, useNavigate, useParams } from 'react-router'

import { EmptyState, LoadingState, StatusBadge } from '@kanbex/ui'

import { KanbanBoard } from '../features/boards/index.js'
import { describeApiError } from '../services/api.js'
import { fetchPublicBoard } from '../services/boardsApi.js'

import type { Board, PublicBoard } from '../types/index.js'

/**
 * Публичная read-only доска для `/share/{id}`. Не требует входа: данные
 * приходят из анонимного `GET /api/public/boards/{id}`, приватная доска
 * отвечает 404 и не отличается от несуществующей.
 */
export function PublicBoardPage() {
  const { boardId = '' } = useParams()
  const navigate = useNavigate()
  const [board, setBoard] = useState<PublicBoard | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let active = true

    setLoading(true)
    setError(null)
    fetchPublicBoard(boardId)
      .then((loaded) => {
        if (!active) return
        setBoard(loaded)
        setError(null)
      })
      .catch((cause: unknown) => {
        if (!active) return
        setBoard(null)
        setError(describeApiError(cause))
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => {
      active = false
    }
  }, [boardId])

  if (loading) {
    return (
      <div className="kb-page">
        <LoadingState label="Загружаем доску…" />
      </div>
    )
  }

  if (!board) {
    return (
      <div className="kb-page">
        <EmptyState
          title={error ? 'Не удалось загрузить доску' : 'Доска не найдена'}
          description={
            error
              ? error
              : 'Доска не существует или владелец отключил публичный доступ.'
          }
          actionLabel="Войти в Kanbex"
          onAction={() => navigate('/login')}
        />
      </div>
    )
  }

  const boardView: Board = {
    id: board.id,
    title: board.title,
    description: board.description,
    version: 0,
    role: 'member',
    isPublic: true,
    columns: board.columns,
  }

  return (
    <div className="kb-public">
      <header className="kb-public__header">
        <div className="kb-public__brand">
          <span className="kb-public__brand-name" aria-hidden="true">
            Kanbex
          </span>
          <StatusBadge tone="neutral">Только для чтения</StatusBadge>
        </div>
        <h1 className="kb-public__title">{board.title}</h1>
        {board.description ? <p className="kb-public__lead">{board.description}</p> : null}
      </header>

      <KanbanBoard
        board={boardView}
        readOnly
        onMoveTask={() => undefined}
        onOpenTask={() => undefined}
        onCreateTask={() => undefined}
      />

      <footer className="kb-public__footer">
        Доска опубликована в Kanbex — <Link to="/login">войти и редактировать</Link>
      </footer>
    </div>
  )
}
