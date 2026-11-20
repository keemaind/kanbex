import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router'
import { AppButton, AppDialog, EmptyState, LoadingState, StatusBadge } from '@kanbex/ui'
import { KanbanBoard, learningTips, TaskCreateDialog, useBoard } from '../features/boards/index.js'
import type { NewTaskInput } from '../features/boards/index.js'
import { LearningTips } from '../features/learning/index.js'
import type { TaskCard as TaskCardModel } from '../types/index.js'

const boardIdPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

const priorityLabels: Record<TaskCardModel['priority'], string> = {
  low: 'Низкий',
  medium: 'Средний',
  high: 'Высокий',
  critical: 'Критический',
}

/**
 * Представление доски: канбан-колонки и обучающие подсказки.
 * Идентификатор, существование и доступ проверяются API.
 */
export function BoardPage() {
  const { boardId = '' } = useParams()
  const navigate = useNavigate()
  const { board, loading, error, saving, lastMove, moveTask, addTask, reset, save } = useBoard(boardId)
  const [activeTask, setActiveTask] = useState<TaskCardModel | null>(null)
  const [createColumnId, setCreateColumnId] = useState<string | null>(null)
  const [resetOpen, setResetOpen] = useState(false)
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

  if (loading) {
    return <BoardPageLoading />
  }

  if (error && !board) {
    return (
      <div className="kb-page">
        <EmptyState
          title="Доска не найдена"
          description={error}
          actionLabel="К списку проектов"
          onAction={() => navigate('/boards')}
        />
      </div>
    )
  }

  if (!board) return null

  const wipRejection = lastMove?.rejection === 'wip-limit'
  const createColumn = createColumnId && board
    ? board.columns.find((column) => column.id === createColumnId) ?? null
    : null

  const handleCreateTask = (input: NewTaskInput) => {
    if (!createColumnId) return

    const result = addTask(createColumnId, input)
    setCreateColumnId(null)
    if (!result) return

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
          <AppButton variant="outlined" size="sm" disabled={saving} onClick={() => setResetOpen(true)}>
            Сбросить доску
          </AppButton>
          <AppButton variant="filled" size="sm" disabled={saving} onClick={() => void save().catch(() => undefined)}>
            {saving ? 'Сохраняем…' : 'Сохранить'}
          </AppButton>
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
        <LearningTips tips={learningTips} />
      </div>

      {error ? <StatusBadge tone="danger" withDot>{error}</StatusBadge> : null}
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
            Изменения находятся в памяти страницы; нажмите «Сохранить», чтобы отправить их на сервер.
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

      <AppDialog
        open={resetOpen}
        title="Сбросить доску?"
        description="Все карточки и изменения будут заменены начальным учебным набором. Отменить это действие нельзя."
        confirmLabel="Сбросить"
        onConfirm={() => {
          setResetOpen(false)
          void reset()
            .then(() => setNotice({ tone: 'success', text: 'Доска восстановлена в начальном состоянии.' }))
            .catch((cause: unknown) => {
              setNotice({ tone: 'danger', text: cause instanceof Error ? cause.message : 'Не удалось сбросить доску.' })
            })
        }}
        onCancel={() => setResetOpen(false)}
      />

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
