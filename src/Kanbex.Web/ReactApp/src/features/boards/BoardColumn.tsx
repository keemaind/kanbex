import { useDroppable } from '@dnd-kit/core'
import { AppButton, StatusBadge } from '@kanbex/ui'
import type { BadgeTone } from '@kanbex/ui'
import type { BoardColumn as BoardColumnModel, TaskCard as TaskCardModel } from '../../types/index.js'
import { canAcceptTask, getWipState } from './boardLogic.js'
import { TaskCard } from './TaskCard.js'

export interface BoardColumnProps {
  column: BoardColumnModel
  /** Все колонки доски — нужны, чтобы найти соседние этапы. */
  boardColumns: BoardColumnModel[]
  disabled?: boolean
  onOpenTask: (task: TaskCardModel) => void
  onMoveTask: (taskId: string, targetColumnId: string) => void
  onCreateTask: (columnId: string) => void
}

function wipTone(used: number, limit: number | null): BadgeTone {
  if (limit === null) return 'neutral'
  if (used > limit) return 'danger'
  if (used >= limit) return 'warning'
  return 'success'
}

/**
 * Колонка канбан-доски: заголовок, счётчик WIP, список карточек и зона
 * для перетаскивания. WIP-лимит подсвечивается, но не блокирует просмотр.
 */
export function BoardColumn({
  column,
  boardColumns,
  disabled = false,
  onOpenTask,
  onMoveTask,
  onCreateTask,
}: BoardColumnProps) {
  const wip = getWipState(column)
  const acceptsTask = canAcceptTask(column)
  const { setNodeRef, isOver } = useDroppable({ id: column.id, data: { columnId: column.id } })

  const sortedTasks = [...column.tasks].sort((a, b) => a.order - b.order)
  const previous = boardColumns.find((candidate) => candidate.order === column.order - 1)
  const next = boardColumns.find((candidate) => candidate.order === column.order + 1)

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
        <StatusBadge
          tone={wipTone(wip.used, wip.limit)}
          title={wip.limit === null ? 'Без ограничения WIP' : `WIP-лимит: ${wip.limit}`}
        >
          {wip.limit === null ? `${wip.used} задач` : `${wip.used} / ${wip.limit}`}
        </StatusBadge>
      </header>

      {wip.limit !== null ? (
        <p className={wip.isAtLimit ? 'kb-column__wip kb-column__wip--limit' : 'kb-column__wip'}>
          {wip.isOverLimit
            ? 'Лимит превышен — освободите слот перед следующей задачей.'
            : wip.isAtLimit
              ? 'Лимит достигнут: сначала завершите или верните задачу.'
              : `WIP-лимит: ${wip.used} из ${wip.limit}.`}
        </p>
      ) : null}

      <div className="kb-column__tasks">
        {sortedTasks.length === 0 ? (
          <p className="kb-column__empty">Пока пусто. Перетащите карточку сюда или создайте новую.</p>
        ) : (
          sortedTasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              column={column}
              disabled={disabled}
              draggable={!disabled}
              onOpen={onOpenTask}
              onMoveNext={(item) => next && onMoveTask(item.id, next.id)}
              onMovePrevious={(item) => previous && onMoveTask(item.id, previous.id)}
              canMoveNext={Boolean(next)}
              canMovePrevious={Boolean(previous)}
            />
          ))
        )}
      </div>

      <AppButton
        variant="text"
        size="sm"
        className="kb-column__add"
        onClick={() => onCreateTask(column.id)}
        disabled={disabled || !acceptsTask}
        title={acceptsTask ? 'Добавить задачу в колонку' : 'WIP-лимит достигнут: сначала завершите задачу'}
      >
        + Задача
      </AppButton>
    </section>
  )
}
