import { useDraggable } from '@dnd-kit/core'
import { StatusBadge } from '@kanbex/ui'
import type { BadgeTone } from '@kanbex/ui'
import type { BoardColumn as BoardColumnModel, TaskCard as TaskCardModel, TaskPriority } from '../../types/index.js'
import { CheckIcon, DragIndicatorIcon } from '../../app/icons.js'

export interface TaskCardProps {
  task: TaskCardModel
  column: BoardColumnModel
  /** Карточка на финальном этапе: зелёная галочка и зачёркнутый заголовок. */
  completed?: boolean
  /** Блокирует взаимодействие, пока идёт «серверное» сохранение. */
  disabled?: boolean
  onOpen: (task: TaskCardModel) => void
  /** Включён ли режим перетаскивания (drag-and-drop — единственный способ перемещения). */
  draggable?: boolean
}

const priorityLabels: Record<TaskPriority, string> = {
  low: 'Низкий приоритет',
  medium: 'Средний приоритет',
  high: 'Высокий приоритет',
  critical: 'Критический приоритет',
}

const priorityTones: Record<TaskPriority, BadgeTone> = {
  low: 'neutral',
  medium: 'info',
  high: 'warning',
  critical: 'danger',
}

/**
 * Карточка задачи: заголовок, описание и метка приоритета. Перемещение между
 * колонками — только через drag-and-drop за ручку (у ручки есть клавиатурная
 * альтернатива: сенсор dnd-kit поддерживает перетаскивание с клавиатуры).
 */
export function TaskCard({
  task,
  column,
  completed = false,
  disabled = false,
  onOpen,
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
      className={
        completed ? 'kb-task kb-task--done' : isDragging ? 'kb-task kb-task--dragging' : 'kb-task'
      }
      data-task-id={task.id}
      aria-label={`Задача: ${task.title}${completed ? ' (завершена)' : ''}`}
    >
      <div className="kb-task__head">
        {completed ? (
          <span className="kb-task__check" title="Задача завершена" aria-hidden="true">
            <CheckIcon />
          </span>
        ) : null}
        <button type="button" className="kb-task__title" onClick={() => onOpen(task)}>
          {task.title}
        </button>
        <button
          ref={setActivatorNodeRef}
          type="button"
          className="kb-task__drag"
          aria-label={`Перетащить задачу «${task.title}» в другую колонку`}
          disabled={disabled || !draggable}
          {...attributes}
          {...listeners}
        >
          <DragIndicatorIcon />
        </button>
      </div>

      {task.description ? <p className="kb-task__description">{task.description}</p> : null}

      <div className="kb-task__foot">
        <StatusBadge tone={priorityTones[task.priority]} withDot>
          {priorityLabels[task.priority]}
        </StatusBadge>
      </div>
    </article>
  )
}
