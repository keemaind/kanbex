import { useDroppable } from '@dnd-kit/core'
import { AppButton } from '@kanbex/ui'
import type { BoardColumn as BoardColumnModel, BoardMember, TaskCard as TaskCardModel } from '../../types/index.js'
import { canAcceptTask, getWipState, isTaskCompleted } from './boardLogic.js'
import { TaskCard } from './TaskCard.js'
import { NoteIcon } from '../../app/icons.js'

export interface BoardColumnProps {
  column: BoardColumnModel
  /** Все колонки доски — нужны, чтобы найти финальный этап. */
  boardColumns: BoardColumnModel[]
  disabled?: boolean
  /** Read-only режим публичной доски: без кнопок добавления и перетаскивания. */
  readOnly?: boolean
  /** Участники доски — источник аватара исполнителя на карточке. */
  members?: BoardMember[]
  /** Идентификатор текущего пользователя — его задачи помечаются «Вы». */
  currentUserId?: string | null
  onOpenTask: (task: TaskCardModel) => void
  onCreateTask: (columnId: string) => void
}

/**
 * Колонка канбан-доски: светлая подложка цвета этапа, заголовок с цветной
 * точкой и счётчиком, список карточек и зона для перетаскивания.
 * WIP-лимит подсвечивается, но не блокирует просмотр.
 */
export function BoardColumn({
  column,
  boardColumns,
  disabled = false,
  readOnly = false,
  members,
  currentUserId = null,
  onOpenTask,
  onCreateTask,
}: BoardColumnProps) {
  const wip = getWipState(column)
  const acceptsTask = canAcceptTask(column)
  const { setNodeRef, isOver } = useDroppable({ id: column.id, data: { columnId: column.id } })

  const sortedTasks = [...column.tasks].sort((a, b) => a.order - b.order)
  const countLabel = wip.limit === null ? String(wip.used) : `${wip.used} / ${wip.limit}`
  const countTitle = wip.limit === null ? 'Без ограничения WIP' : `WIP-лимит: ${wip.limit}`
  const atLimit = wip.isAtLimit || wip.isOverLimit

  return (
    <section
      ref={setNodeRef}
      className={isOver ? 'kb-column kb-column--over' : 'kb-column'}
      aria-labelledby={`column-title-${column.id}`}
      data-column-id={column.id}
      data-stage={column.order % 3}
    >
      <header className="kb-column__header">
        <h2 className="kb-column__title" id={`column-title-${column.id}`}>
          {column.title}
        </h2>
        <span className={atLimit ? 'kb-column__count kb-column__count--limit' : 'kb-column__count'} title={countTitle}>
          {countLabel}
        </span>
      </header>

      {atLimit ? (
        <p className="kb-column__wip kb-column__wip--limit">
          {wip.isOverLimit
            ? 'Лимит превышен — освободите слот перед следующей задачей.'
            : 'Лимит достигнут: сначала завершите или верните задачу.'}
        </p>
      ) : null}

      <div className="kb-column__tasks">
        {sortedTasks.length === 0 ? (
          <div className="kb-column__empty">
            <span className="kb-column__empty-icon" aria-hidden="true">
              <NoteIcon />
            </span>
            {readOnly ? (
              <p className="kb-column__empty-text">В этой колонке пока нет карточек</p>
            ) : (
              <>
                <p className="kb-column__empty-text">Перетащите сюда карточку или создайте новую</p>
                <AppButton
                  variant="text"
                  size="sm"
                  onClick={() => onCreateTask(column.id)}
                  disabled={disabled || !acceptsTask}
                  title={acceptsTask ? 'Добавить задачу в колонку' : 'WIP-лимит достигнут'}
                >
                  + Добавить задачу
                </AppButton>
              </>
            )}
          </div>
        ) : (
          sortedTasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              column={column}
              completed={isTaskCompleted(task, column, boardColumns)}
              disabled={disabled}
              readOnly={readOnly}
              members={members}
              currentUserId={currentUserId}
              draggable={!disabled}
              onOpen={onOpenTask}
            />
          ))
        )}
      </div>

      {sortedTasks.length > 0 && !readOnly ? (
        <AppButton
          variant="text"
          size="sm"
          className="kb-column__add"
          onClick={() => onCreateTask(column.id)}
          disabled={disabled || !acceptsTask}
          title={acceptsTask ? 'Добавить задачу в колонку' : 'WIP-лимит достигнут: сначала завершите задачу'}
        >
          + Добавить задачу
        </AppButton>
      ) : null}
    </section>
  )
}
