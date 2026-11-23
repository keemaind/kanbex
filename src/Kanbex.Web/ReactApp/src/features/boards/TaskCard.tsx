import { useDraggable } from '@dnd-kit/core'
import { StatusBadge } from '@kanbex/ui'
import type { BadgeTone } from '@kanbex/ui'
import type { CSSProperties } from 'react'
import type { BoardColumn as BoardColumnModel, TaskCard as TaskCardModel, TaskPriority } from '../../types/index.js'
import { CheckIcon, ClockIcon, DragIndicatorIcon, NoteIcon, PersonIcon } from '../../app/icons.js'

export interface TaskCardProps {
  task: TaskCardModel
  column: BoardColumnModel
  /** Карточка на финальном этапе: зелёная галочка и зачёркнутый заголовок. */
  completed?: boolean
  /** Блокирует взаимодействие, пока идёт «серверное» сохранение. */
  disabled?: boolean
  /** Read-only режим публичной доски: без ручки и открытия карточки. */
  readOnly?: boolean
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

function isOverdue(dueDate: string, completed: boolean): boolean {
  if (completed) return false

  const due = new Date(dueDate)
  if (Number.isNaN(due.getTime())) return false

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return due < today
}

function formatDue(dueDate: string): string {
  const date = new Date(dueDate)
  if (Number.isNaN(date.getTime())) return dueDate
  return date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })
}

/**
 * Карточка задачи: заголовок, описание, исполнитель, дедлайн, оценка, теги.
 * Перемещение между колонками — только через drag-and-drop за ручку (у ручки
 * есть клавиатурная альтернатива: сенсор dnd-kit поддерживает перетаскивание
 * с клавиатуры).
 */
export function TaskCard({
  task,
  column,
  completed = false,
  disabled = false,
  readOnly = false,
  onOpen,
  draggable = true,
}: TaskCardProps) {
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, isDragging } = useDraggable({
    id: task.id,
    data: { taskId: task.id, columnId: column.id },
    disabled: disabled || !draggable || readOnly,
  })

  const overdue = task.dueDate ? isOverdue(task.dueDate, completed) : false
  const commentCount = task.commentCount ?? 0

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
        {readOnly ? (
          <span className="kb-task__title-static">{task.title}</span>
        ) : (
          <button type="button" className="kb-task__title" onClick={() => onOpen(task)}>
            {task.title}
          </button>
        )}
        {!readOnly ? (
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
        ) : null}
      </div>

      {task.description ? <p className="kb-task__description">{task.description}</p> : null}

      {task.tags && task.tags.length > 0 ? (
        <div className="kb-task__tags">
          {task.tags.map((tag) => (
            <span
              key={tag.id}
              className="kb-task__tag"
              style={{ '--kb-tag-color': tag.color } as CSSProperties}
            >
              {tag.name}
            </span>
          ))}
        </div>
      ) : null}

      {task.assigneeName || task.dueDate || (task.estimate !== null && task.estimate !== undefined) ? (
        <div className="kb-task__meta">
          {task.assigneeName ? (
            <span className="kb-task__meta-item" title="Исполнитель">
              <PersonIcon />
              {task.assigneeName}
            </span>
          ) : null}
          {task.dueDate ? (
            <span
              className={overdue ? 'kb-task__meta-item kb-task__meta-item--overdue' : 'kb-task__meta-item'}
              title={overdue ? 'Просрочено' : 'Дедлайн'}
            >
              <ClockIcon />
              {formatDue(task.dueDate)}
            </span>
          ) : null}
          {task.estimate !== null && task.estimate !== undefined ? (
            <span className="kb-task__meta-item" title="Оценка">
              {task.estimate} ед.
            </span>
          ) : null}
        </div>
      ) : null}

      <div className="kb-task__foot">
        <StatusBadge tone={priorityTones[task.priority]} withDot>
          {priorityLabels[task.priority]}
        </StatusBadge>
        {commentCount > 0 ? (
          <span className="kb-task__comments" title="Комментарии">
            <NoteIcon />
            {commentCount}
          </span>
        ) : null}
      </div>
    </article>
  )
}
