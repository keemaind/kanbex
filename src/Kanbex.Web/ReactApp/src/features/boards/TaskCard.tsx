import { useDraggable } from '@dnd-kit/core'
import { AppButton, StatusBadge } from '@kanbex/ui'
import type { BadgeTone } from '@kanbex/ui'
import type { BoardColumn as BoardColumnModel, TaskCard as TaskCardModel, TaskPriority } from '../../types/index.js'

export interface TaskCardProps {
  task: TaskCardModel
  column: BoardColumnModel
  /** Блокирует кнопки, пока идёт «серверное» сохранение. */
  disabled?: boolean
  onOpen: (task: TaskCardModel) => void
  onMoveNext: (task: TaskCardModel) => void
  onMovePrevious: (task: TaskCardModel) => void
  canMoveNext: boolean
  canMovePrevious: boolean
  /** Включён ли режим перетаскивания (drag-and-drop — не единственный способ). */
  draggable?: boolean
}

const priorityLabels: Record<TaskPriority, string> = {
  low: 'Низкий приоритет',
  medium: 'Средний приоритет',
  high: 'Высокий приоритет',
}

const priorityTones: Record<TaskPriority, BadgeTone> = {
  low: 'neutral',
  medium: 'info',
  high: 'warning',
}

/**
 * Карточка задачи. Остаётся в feature-коде доски, потому что знает о
 * приоритетах, порядках и перемещении между колонками.
 *
 * Перетаскивание доступно только за ручку (drag handle); кнопки «Назад» и
 * «Далее» дают эквивалентную клавиатурную альтернативу.
 */
export function TaskCard({
  task,
  column,
  disabled = false,
  onOpen,
  onMoveNext,
  onMovePrevious,
  canMoveNext,
  canMovePrevious,
  draggable = true,
}: TaskCardProps) {
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, isDragging } = useDraggable({
    id: task.id,
    data: { taskId: task.id, columnId: column.id },
    disabled: disabled || !draggable,
  })

  return (
    <article
      ref={setNodeRef}
      className={isDragging ? 'kb-task kb-task--dragging' : 'kb-task'}
      data-task-id={task.id}
      aria-label={`Задача: ${task.title}`}
    >
      <div className="kb-task__head">
        <StatusBadge tone={priorityTones[task.priority]} withDot>
          {priorityLabels[task.priority]}
        </StatusBadge>

        <button
          ref={setActivatorNodeRef}
          type="button"
          className="kb-task__drag"
          aria-label={`Перетащить задачу «${task.title}» в другую колонку`}
          disabled={disabled || !draggable}
          {...attributes}
          {...listeners}
        >
          <span aria-hidden="true">⠿</span>
        </button>
      </div>

      <button type="button" className="kb-task__title" onClick={() => onOpen(task)}>
        {task.title}
      </button>

      <p className="kb-task__description">{task.description}</p>

      <div className="kb-task__actions">
        <AppButton
          variant="text"
          size="xs"
          onClick={() => onMovePrevious(task)}
          disabled={disabled || !canMovePrevious}
          aria-label={`Вернуть задачу «${task.title}» на предыдущий этап`}
        >
          ← Назад
        </AppButton>
        <AppButton
          variant="text"
          size="xs"
          onClick={() => onMoveNext(task)}
          disabled={disabled || !canMoveNext}
          aria-label={`Переместить задачу «${task.title}» на следующий этап`}
        >
          Далее →
        </AppButton>
      </div>
    </article>
  )
}
