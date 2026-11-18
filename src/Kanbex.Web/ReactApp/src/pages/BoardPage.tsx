import { useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router'
import { AppButton, AppDialog, EmptyState, LoadingState, StatusBadge } from '@kanbex/ui'
import { demoBoard, demoLearningTips, getBoardForProject, KanbanBoard, TaskCreateDialog, useBoard } from '../features/boards/index.js'
import type { NewTaskInput } from '../features/boards/index.js'
import { LearningTips } from '../features/learning/index.js'
import type { TaskCard as TaskCardModel } from '../types/index.js'

const boardIdPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

const priorityLabels: Record<TaskCardModel['priority'], string> = {
  low: 'Низкий',
  medium: 'Средний',
  high: 'Высокий',
}

/**
 * Представление доски: канбан-колонки и обучающие подсказки.
 * `boardId` проверяется по формату GUID; существование и доступ
 * подтвердит сервер при подключении API.
 */
export function BoardPage() {
  const { boardId = '' } = useParams()
  const navigate = useNavigate()
  // Доска берётся из списка проектов; для созданных на клиенте проектов
  // собирается пустая стартовая доска с теми же тремя этапами.
  const initialBoard = useMemo(() => getBoardForProject(boardId), [boardId])
  const { board, lastMove, moveTask, addTask, resetBoard } = useBoard(initialBoard ?? demoBoard)
  const [activeTask, setActiveTask] = useState<TaskCardModel | null>(null)
  const [createColumnId, setCreateColumnId] = useState<string | null>(null)
  const [notice, setNotice] = useState<{ tone: 'success' | 'danger'; text: string } | null>(null)

  if (!boardIdPattern.test(boardId)) {
    return (
      <div className="kb-page">
        <EmptyState
          title="Некорректный идентификатор доски"
          description="Идентификатор в адресе должен быть GUID. Выберите проект из списка — и адрес будет сформирован правильно."
          actionLabel="К списку проектов"
          onAction={() => {
            navigate('/boards')
          }}
        />
      </div>
    )
  }

  if (!initialBoard) {
    return (
      <div className="kb-page">
        <EmptyState
          title="Проект не найден"
          description="Возможно, проект был удалён или ссылка устарела. Вернитесь к списку и выберите существующий проект."
          actionLabel="К списку проектов"
          onAction={() => {
            navigate('/boards')
          }}
        />
      </div>
    )
  }

  const wipRejection = lastMove?.rejection === 'wip-limit'
  const createColumn = createColumnId
    ? board.columns.find((column) => column.id === createColumnId) ?? null
    : null

  const handleCreateTask = (input: NewTaskInput) => {
    if (!createColumnId) return

    const result = addTask(createColumnId, input)
    setCreateColumnId(null)

    if (result.rejection === 'wip-limit') {
      setNotice({ tone: 'danger', text: 'Задача не добавлена: в колонке достигнут WIP-лимит.' })
      return
    }

    if (!result.task) {
      setNotice({ tone: 'danger', text: 'Задача не добавлена: проверьте название и выбранную колонку.' })
      return
    }

    setNotice({ tone: 'success', text: `Задача «${result.task.title}» добавлена.` })
  }

  return (
    <div className="kb-page">
      <div className="kb-page__head">
        <div>
          <nav className="kb-breadcrumb" aria-label="Хлебные крошки">
            <Link to="/boards">Проекты</Link>
            <span aria-hidden="true">/</span>
            <span>{board.title}</span>
          </nav>
          <h1 className="kb-page__title">{board.title}</h1>
          <p className="kb-page__lead">{board.description}</p>
        </div>
        <div className="kb-page__actions">
          {boardId === demoBoard.id ? (
            <AppButton
              variant="outlined"
              size="sm"
              onClick={() => {
                resetBoard(demoBoard)
                setNotice(null)
                setCreateColumnId(null)
              }}
              aria-label="Вернуть демонстрационную доску в исходное состояние"
            >
              Сбросить демо
            </AppButton>
          ) : null}
        </div>
      </div>

      <div className="kb-board-layout">
        <KanbanBoard
          board={board}
          onMoveTask={(taskId, targetColumnId) => {
            setNotice(null)
            moveTask(taskId, targetColumnId)
          }}
          onOpenTask={(task) => setActiveTask(task)}
          onCreateTask={(columnId) => setCreateColumnId(columnId)}
        />
        <LearningTips tips={demoLearningTips} />
      </div>

      <div className="kb-board__feedback" role="status" aria-live="polite">
        {notice ? (
          <StatusBadge tone={notice.tone} withDot>
            {notice.text}
          </StatusBadge>
        ) : wipRejection ? (
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
              <dd>{priorityLabels[activeTask.priority]}</dd>
            </div>
            <div>
              <dt>Позиция</dt>
              <dd>#{activeTask.order + 1}</dd>
            </div>
          </dl>
        ) : null}
      </AppDialog>

      {createColumn ? (
        <TaskCreateDialog
          columnTitle={createColumn.title}
          onCreate={handleCreateTask}
          onCancel={() => setCreateColumnId(null)}
        />
      ) : null}
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
