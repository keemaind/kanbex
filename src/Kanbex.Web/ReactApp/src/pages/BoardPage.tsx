import { useCallback, useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router'
import {
  AppButton,
  AppDialog,
  AppIconButton,
  AppMenu,
  AppMenuItem,
  EmptyState,
  LoadingState,
  StatusBadge,
} from '@kanbex/ui'
import {
  BoardSettingsDialog,
  ColumnManagerDialog,
  KanbanBoard,
  TagManagerDialog,
  TaskCreateDialog,
  TaskEditDialog,
  getBoardProgress,
  pluralize,
  useBoard,
} from '../features/boards/index.js'
import type { NewTaskInput, TaskEditValues } from '../features/boards/index.js'
import { useAuth } from '../features/auth/AuthProvider.js'
import { ArrowBackIcon, FolderIcon, MoreIcon, PlusIcon } from '../app/icons.js'
import { fetchBoardMembers } from '../services/boardsApi.js'
import type { BoardMember } from '../types/index.js'
import type { Tag } from '../types/index.js'
import type { TaskCard as TaskCardModel } from '../types/index.js'

const boardIdPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

type SaveTone = 'info' | 'danger' | 'warning' | 'success'

/**
 * Рабочая область проекта: шапка с прогрессом, панель создания задачи
 * и канбан-доска. Идентификатор, существование и доступ проверяются API.
 */
export function BoardPage() {
  const { boardId = '' } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const {
    board,
    role,
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
    clearTasks,
    updateBoard,
    replaceColumns,
    setVisibility,
    updateTaskMeta,
    reset,
    save,
    reload,
    overwrite,
  } = useBoard(boardId)
  const [editTaskId, setEditTaskId] = useState<string | null>(null)
  const [taskToDelete, setTaskToDelete] = useState<TaskCardModel | null>(null)
  const [createColumnId, setCreateColumnId] = useState<string | null>(null)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [columnsOpen, setColumnsOpen] = useState(false)
  const [tagsOpen, setTagsOpen] = useState(false)
  const [resetOpen, setResetOpen] = useState(false)
  const [clearOpen, setClearOpen] = useState(false)
  const [notice, setNotice] = useState<{ tone: 'success' | 'danger'; text: string } | null>(null)
  const [members, setMembers] = useState<BoardMember[]>([])

  /** (Пере)загружает участников доски. Вызывается при монтировании и при
   *  закрытии настроек: там участники добавляются в собственном состоянии
   *  секции, и без перезагрузки селекторы исполнителя показывали старый
   *  список без нового участника. */
  const refreshMembers = useCallback(() => {
    if (!boardIdPattern.test(boardId)) return

    let active = true
    fetchBoardMembers(boardId)
      .then((list) => {
        if (active) setMembers(list)
      })
      .catch(() => {
        // Без участников достаточно пустого списка исполнителя.
        if (active) setMembers([])
      })
    return () => {
      active = false
    }
  }, [boardId])

  useEffect(() => refreshMembers(), [refreshMembers])

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

  const isCreator = role === 'creator'
  const progress = getBoardProgress(board)
  const quickAddColumn = [...board.columns].sort((a, b) => a.order - b.order)[0] ?? null
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
    ? 'Сохранение…'
    : conflict
      ? 'Конфликт версии'
      : saveError
        ? 'Ошибка сохранения'
        : dirty
          ? 'Есть изменения'
          : 'Сохранено'

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

  /** Переименование или смена цвета тега: обновляем его на всех карточках. */
  const handleTagUpdated = (tag: Tag) => {
    if (!board) return

    board.columns
      .flatMap((column) => column.tasks)
      .forEach((task) => {
        if (task.tags?.some((item) => item.id === tag.id)) {
          updateTaskMeta(task.id, {
            tags: task.tags.map((item) => (item.id === tag.id ? tag : item)),
          })
        }
      })
  }

  /** Удаление тега: снимаем его со всех карточек локально. */
  const handleTagDeleted = (tagId: string) => {
    if (!board) return

    board.columns
      .flatMap((column) => column.tasks)
      .forEach((task) => {
        if (task.tags?.some((item) => item.id === tagId)) {
          updateTaskMeta(task.id, { tags: task.tags.filter((item) => item.id !== tagId) })
        }
      })
  }

  return (
    <div className="kb-workspace">
      <header className="kb-project-header">
        <div className="kb-project-header__main">
          <Link className="kb-project-header__back" to="/boards">
            <ArrowBackIcon />
            Мои проекты
          </Link>
          <div className="kb-project-header__row">
            <span className="kb-project-header__icon" aria-hidden="true">
              <FolderIcon />
            </span>
            <div className="kb-project-header__titles">
              <h1 className="kb-project-header__title">{board.title}</h1>
              {board.description ? <p className="kb-project-header__lead">{board.description}</p> : null}
            </div>
            <div
              className="kb-project-header__progress"
              title={`Завершено ${progress.completed} из ${progress.total} задач`}
            >
              <span className="kb-project-header__progress-value">{progress.percent}%</span>
              <span className="kb-project-header__progress-track" aria-hidden="true">
                <span
                  className="kb-project-header__progress-bar"
                  style={{ width: `${progress.percent}%` }}
                />
              </span>
              <span className="kb-project-header__progress-caption">
                {progress.completed} из {progress.total}
              </span>
            </div>
            <span className={`kb-save-indicator kb-save-indicator--${saveTone}`}>
              <span className="kb-save-indicator__dot" aria-hidden="true" />
              {saveLabel}
            </span>
          </div>
        </div>
        <div className="kb-project-header__tools">
          <AppMenu
            align="end"
            aria-label="Меню доски"
            trigger={
              <AppIconButton variant="standard" size="sm" icon={<MoreIcon />} aria-label="Меню доски" />
            }
          >
            <AppMenuItem
              disabled={saving || !dirty}
              onClick={() => void save().catch(() => undefined)}
            >
              Сохранить
            </AppMenuItem>
            <AppMenuItem disabled={saving || progress.total === 0} onClick={() => setClearOpen(true)}>
              Очистить задачи
            </AppMenuItem>
            {isCreator ? (
              <AppMenuItem disabled={saving} onClick={() => setResetOpen(true)}>
                Сбросить доску
              </AppMenuItem>
            ) : null}
          </AppMenu>
        </div>
      </header>

      <div className="kb-toolbar">
        <AppButton
          variant="filled"
          size="sm"
          className="kb-add-task"
          startIcon={<PlusIcon />}
          disabled={quickAddColumn === null}
          title={quickAddColumn ? 'Добавить задачу в первую колонку' : 'Сначала добавьте колонку'}
          onClick={() => quickAddColumn && setCreateColumnId(quickAddColumn.id)}
        >
          Добавить задачу
        </AppButton>
        {isCreator ? (
          <AppButton variant="outlined" size="sm" onClick={() => setSettingsOpen(true)}>
            Настройки проекта
          </AppButton>
        ) : null}
        <AppButton variant="outlined" size="sm" onClick={() => setColumnsOpen(true)}>
          Настройки колонок
        </AppButton>
        {isCreator ? (
          <AppButton variant="outlined" size="sm" onClick={() => setTagsOpen(true)}>
            Теги
          </AppButton>
        ) : null}
      </div>

      <KanbanBoard
        board={board}
        members={members}
        currentUserId={user?.id ?? null}
        onMoveTask={(taskId, targetColumnId) => {
          setNotice(null)
          moveTask(taskId, targetColumnId)
        }}
        onOpenTask={(task) => setEditTaskId(task.id)}
        onCreateTask={(columnId) => setCreateColumnId(columnId)}
      />

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
          boardId={boardId}
          columns={board.columns}
          members={members}
          currentUserId={user?.id ?? null}
          isCreator={isCreator}
          onCommentCountChange={(count) => updateTaskMeta(editingTask.id, { commentCount: count })}
          onTagsChange={(tags) => updateTaskMeta(editingTask.id, { tags })}
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

      {settingsOpen ? (
        <BoardSettingsDialog
          board={board}
          onSave={(values) => {
            updateBoard(values)
            setSettingsOpen(false)
            setNotice({ tone: 'success', text: 'Настройки доски обновлены.' })
          }}
          onVisibilityChange={async (isPublic) => {
            await setVisibility(isPublic)
            setNotice({
              tone: 'success',
              text: isPublic ? 'Доска опубликована.' : 'Публичный доступ отключён.',
            })
          }}
          onClose={() => {
            setSettingsOpen(false)
            refreshMembers()
          }}
        />
      ) : null}

      {tagsOpen ? (
        <TagManagerDialog
          boardId={board.id}
          onTagUpdated={handleTagUpdated}
          onTagDeleted={handleTagDeleted}
          onClose={() => setTagsOpen(false)}
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
        open={clearOpen}
        title="Удалить все задачи?"
        description={`С доски исчезнут ${progress.total} ${pluralize(progress.total, [
          'карточка',
          'карточки',
          'карточек',
        ])}. Колонки и WIP-лимиты останутся. Отменить действие нельзя.`}
        confirmLabel="Удалить все"
        onConfirm={() => {
          setClearOpen(false)
          const cleared = clearTasks()
          setNotice({ tone: 'success', text: `Удалено карточек: ${cleared}.` })
        }}
        onCancel={() => setClearOpen(false)}
      />

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
          members={members}
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
