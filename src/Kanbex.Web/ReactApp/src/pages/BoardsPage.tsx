import { useState } from 'react'
import { Link } from 'react-router'
import { AppButton, AppDialog, EmptyState, StatusBadge } from '@kanbex/ui'
import { demoBoardSummaries } from '../features/boards/index.js'

/**
 * Список досок пользователя. Пока показывает демонстрационную доску;
 * после подключения API данные придёт из `fetchBoards()`.
 */
export function BoardsPage() {
  const [createOpen, setCreateOpen] = useState(false)
  const boards = demoBoardSummaries

  return (
    <div className="kb-page">
      <div className="kb-page__head">
        <div>
          <h1 className="kb-page__title">Мои доски</h1>
          <p className="kb-page__lead">
            Выберите доску, чтобы открыть канбан. Список будет загружаться из{' '}
            <code>GET /api/boards</code> после подключения API.
          </p>
        </div>
        <AppButton variant="filled" size="md" onClick={() => setCreateOpen(true)}>
          Новая доска
        </AppButton>
      </div>

      {boards.length === 0 ? (
        <EmptyState
          title="Досок пока нет"
          description="Создайте первую доску: в ней появятся колонки «К выполнению», «В работе» и «Готово»."
          actionLabel="Создать доску"
          onAction={() => setCreateOpen(true)}
        />
      ) : (
        <ul className="kb-board-list">
          {boards.map((board) => (
            <li key={board.id}>
              <Link className="kb-board-card" to={`/boards/${board.id}`}>
                <span className="kb-board-card__title">{board.title}</span>
                <span className="kb-board-card__description">{board.description}</span>
                <span className="kb-board-card__meta">
                  <StatusBadge tone="info">{board.columnCount} колонки</StatusBadge>
                  <StatusBadge tone="neutral">{board.taskCount} задач</StatusBadge>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}

      <AppDialog
        open={createOpen}
        title="Создание доски"
        description="В каркасе создание доски ещё не сохраняется на сервере. Здесь появится форма с названием и стартовыми колонками, а данные уйдут в POST /api/boards."
        confirmLabel="Понятно"
        cancelLabel={null}
        onConfirm={() => setCreateOpen(false)}
        onCancel={() => setCreateOpen(false)}
      />
    </div>
  )
}
