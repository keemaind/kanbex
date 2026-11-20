import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router'
import { AppButton, AppDialog, EmptyState, LoadingState, StatusBadge } from '@kanbex/ui'
import {
  BoardDetailsDialog,
  ColumnManagerDialog,
  KanbanBoard,
  TaskCreateDialog,
  TaskEditDialog,
  useBoard,
} from '../features/boards/index.js'
import type { NewTaskInput, TaskEditValues } from '../features/boards/index.js'
import type { TaskCard as TaskCardModel } from '../types/index.js'

const boardIdPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

type SaveTone = 'info' | 'danger' | 'warning' | 'success'

/**
 * Представление доски: канбан-колонки, редактирование карточек и колонок.
 * Идентификатор, существование и доступ проверяются API.
 */
export function BoardPage() {
  const { boardId = '' } = useParams()
  const navigate = useNavigate()
  const {
    board,
    loading,
    error,
    saveError,
    saving,
    dirty,
    conflict,
    lastMove,
    moveTask,
    addTask,
    updateTask,
    deleteTask,
    updateBoard,
    replaceColumns,
    reset,
    save,
    reload,
    overwrite,
  } = useBoard(boardId)
  const [editTaskId, setEditTaskId] = useState<string | null>(null)
  const [taskToDelete, setTaskToDelete] = useState<TaskCardModel | null>(null)
  const [createColumnId, setCreateColumnId] = useState<string | null>(null)
  const [detailsOpen, setDetailsOpen] = useState(false)
  const [columnsOpen, setColumnsOpen] = useState(false)
  const [resetOpen, setResetOpen] = useState(false)
  const [notice, setNotice] = useState<{ tone: 'success' | 'danger'; text: string } | null>(null)

  useEffect(() => {
    if (!dirty) return

    const handler = (event: BeforeUnloadEvent) => {
      event.preventDefault()
      event.returnValue = ''
    }

    window.addEventListener('beforeunload', handler)
    return () => window.removeEventListener('beforeunload', handler)
  }, [dirty])

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
  const createColumn = createColumnId
    ? board.columns.find((column) => column.id === createColumnId) ?? null
    : null
  const editingTask = editTaskId
    ? board.columns.flatMap((column) => column.tasks).find((task) => task.id === editTaskId) ?? null
    : null
  const editingTaskColumn = editTaskId
    ? board.columns.find((column) => column.tasks.some((task) => task.id === editTaskId)) ?? null
    : null

  const saveTone: SaveTone = saving
    ? 'info'
    : conflict || saveError
      ? 'danger'
      : dirty
        ? 'warning'
        : 'success'
  const saveLabel = saving
    ? 'Сохраняем…'
    : conflict
      ? 'Конфликт версии'
      : saveError
        ? 'Не удалось сохранить'
        : dirty
          ? 'Есть несохранённые изменения'
          : 'Все изменения сохранены'

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

  const handleEditTask = (values: TaskEditValues) => {
    if (!editingTask) return

    updateTask(editingTask.id, values)
    setEditTaskId(null)
    setNotice({ tone: 'success', text: 'Карточка обновлена.' })
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
          <StatusBadge tone={saveTone} withDot>
            {saveLabel}
          </StatusBadge>
          <AppButton variant="text" size="sm" onClick={() => setColumnsOpen(true)}>
            Колонки
          </AppButton>
          <AppButton variant="text" size="sm" onClick={() => setDetailsOpen(true)}>
            Настройки
          </AppButton>
          <AppButton variant="outlined" size="sm" disabled={saving} onClick={() => setResetOpen(true)}>
            Сбросить
          </AppButton>
          <AppButton
            variant="filled"
            size="sm"
            disabled={saving || !dirty}
            onClick={() => void save().catch(() => undefined)}
          >
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
          onOpenTask={(task) => setEditTaskId(task.id)}
          onCreateTask={(columnId) => setCreateColumnId(columnId)}
        />
      </div>

      {saveError ? <StatusBadge tone="danger" withDot>{saveError}</StatusBadge> : null}
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
            Изменения сохраняются автоматически; кнопка «Сохранить» отправляет их сразу.
          </span>
        )}
      </div>

      {editingTask && editingTaskColumn ? (
        <TaskEditDialog
          task={editingTask}
          columnTitle={editingTaskColumn.title}
          onSave={handleEditTask}
          onDelete={() => {
            setTaskToDelete(editingTask)
            setEditTaskId(null)
          }}
          onCancel={() => setEditTaskId(null)}
        />
      ) : null}

      <AppDialog
        open={taskToDelete !== null}
        title="Удалить карточку?"
        description={taskToDelete ? `Карточка «${taskToDelete.title}» будет удалена.` : undefined}
        confirmLabel="Удалить"
        onConfirm={() => {
          if (taskToDelete) {
            deleteTask(taskToDelete.id)
            setTaskToDelete(null)
            setNotice({ tone: 'success', text: 'Карточка удалена.' })
          }
        }}
        onCancel={() => setTaskToDelete(null)}
      />

      {detailsOpen ? (
        <BoardDetailsDialog
          title={board.title}
          description={board.description}
          onSave={(values) => {
            updateBoard(values)
            setDetailsOpen(false)
            setNotice({ tone: 'success', text: 'Настройки доски обновлены.' })
          }}
          onCancel={() => setDetailsOpen(false)}
        />
      ) : null}

      {columnsOpen ? (
        <ColumnManagerDialog
          columns={board.columns}
          onApply={(columns) => {
            replaceColumns(columns)
            setColumnsOpen(false)
            setNotice({ tone: 'success', text: 'Колонки обновлены.' })
          }}
          onCancel={() => setColumnsOpen(false)}
        />
      ) : null}

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

      <AppDialog
        open={conflict}
        title="Доска изменена на сервере"
        description="Пока вы редактировали, доску сохранили в другой вкладке. Загрузите актуальную версию или сохраните свои изменения поверх неё."
        confirmLabel="Загрузить актуальную"
        cancelLabel={null}
        busy={saving}
        onConfirm={() => {
          void reload()
            .then(() => setNotice({ tone: 'success', text: 'Загружена актуальная версия доски.' }))
            .catch((cause: unknown) => {
              setNotice({ tone: 'danger', text: cause instanceof Error ? cause.message : 'Не удалось загрузить доску.' })
            })
        }}
        onCancel={() => undefined}
      >
        <AppButton
          variant="tonal"
          disabled={saving}
          onClick={() => {
            void overwrite()
              .then(() => setNotice({ tone: 'success', text: 'Изменения сохранены поверх актуальной версии.' }))
              .catch((cause: unknown) => {
                setNotice({ tone: 'danger', text: cause instanceof Error ? cause.message : 'Не удалось сохранить доску.' })
              })
          }}
        >
          Сохранить мои изменения поверх
        </AppButton>
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
