import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router'
import { AppButton, AppDialog, EmptyState, LoadingState, StatusBadge } from '@kanbex/ui'
import { demoBoard, demoLearningTips, KanbanBoard, useBoard } from '../features/boards/index.js'
import { LearningTips } from '../features/learning/index.js'
import type { TaskCard as TaskCardModel } from '../types/index.js'

const boardIdPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

/**
 * Представление доски: канбан-колонки и обучающие подсказки.
 * `boardId` проверяется по формату GUID; существование и доступ
 * подтвердит сервер при подключении API.
 */
export function BoardPage() {
  const { boardId = '' } = useParams()
  const navigate = useNavigate()
  const { board, lastMove, moveTask, resetBoard } = useBoard(demoBoard)
  const [activeTask, setActiveTask] = useState<TaskCardModel | null>(null)

  if (!boardIdPattern.test(boardId)) {
    return (
      <div className="kb-page">
        <EmptyState
          title="Некорректный идентификатор доски"
          description="Идентификатор в адресе должен быть GUID. Выберите доску из списка — и адрес будет сформирован правильно."
          actionLabel="К списку досок"
          onAction={() => {
            navigate('/boards')
          }}
        />
      </div>
    )
  }

  if (boardId !== demoBoard.id) {
    return (
      <div className="kb-page">
        <EmptyState
          title="Доска не найдена"
          description="В каркасе доступна одна демонстрационная доска. Загрузка произвольной доски появится вместе с GET /api/boards/{boardId}."
          actionLabel="Открыть демонстрационную доску"
          onAction={() => {
            navigate(`/boards/${demoBoard.id}`)
          }}
        />
      </div>
    )
  }

  const wipRejection = lastMove?.rejection === 'wip-limit'

  return (
    <div className="kb-page">
      <div className="kb-page__head">
        <div>
          <nav className="kb-breadcrumb" aria-label="Хлебные крошки">
            <Link to="/boards">Мои доски</Link>
            <span aria-hidden="true">/</span>
            <span>{board.title}</span>
          </nav>
          <h1 className="kb-page__title">{board.title}</h1>
          <p className="kb-page__lead">{board.description}</p>
        </div>
        <div className="kb-page__actions">
          <AppButton
            variant="outlined"
            size="sm"
            onClick={() => resetBoard(demoBoard)}
            aria-label="Вернуть демонстрационную доску в исходное состояние"
          >
            Сбросить демо
          </AppButton>
        </div>
      </div>

      <div className="kb-board-layout">
        <KanbanBoard
          board={board}
          onMoveTask={(taskId, targetColumnId) => moveTask(taskId, targetColumnId)}
          onOpenTask={(task) => setActiveTask(task)}
        />
        <LearningTips tips={demoLearningTips} />
      </div>

      <div className="kb-board__feedback" role="status" aria-live="polite">
        {wipRejection ? (
          <StatusBadge tone="danger" withDot>
            Перемещение отклонено: в целевой колонке достигнут WIP-лимит.
          </StatusBadge>
        ) : lastMove?.moved ? (
          <StatusBadge tone="success" withDot>
            Карточка перемещена.
          </StatusBadge>
        ) : (
          <span className="kb-board__feedback-idle">
            Изменения хранятся локально до подключения PUT /api/boards/{'{boardId}'}.
          </span>
        )}
      </div>

      <AppDialog
        open={activeTask !== null}
        title={activeTask?.title ?? 'Задача'}
        description={activeTask?.description}
        confirmLabel="Закрыть"
        cancelLabel={null}
        onConfirm={() => setActiveTask(null)}
        onCancel={() => setActiveTask(null)}
      >
        {activeTask ? (
          <dl className="kb-task-meta">
            <div>
              <dt>Приоритет</dt>
              <dd>{activeTask.priority}</dd>
            </div>
            <div>
              <dt>Позиция</dt>
              <dd>#{activeTask.order + 1}</dd>
            </div>
          </dl>
        ) : null}
      </AppDialog>
    </div>
  )
}

/** Заготовка состояния загрузки доски для будущего API-запроса. */
export function BoardPageLoading() {
  return (
    <div className="kb-page">
      <LoadingState label="Загружаем доску…" />
    </div>
  )
}
