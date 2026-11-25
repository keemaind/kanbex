import { useDraggable } from '@dnd-kit/core'
import { StatusBadge } from '@kanbex/ui'
import type { BadgeTone } from '@kanbex/ui'
import type { CSSProperties } from 'react'
import type {
  BoardColumn as BoardColumnModel,
  BoardMember,
  TaskCard as TaskCardModel,
  TaskPriority,
} from '../../types/index.js'
import { getInitials } from '../../app/avatar.js'
import { CalendarIcon, CheckIcon, DragIndicatorIcon, NoteIcon } from '../../app/icons.js'

export interface TaskCardProps {
  task: TaskCardModel
  column: BoardColumnModel
  /** Карточка на финальном этапе: зелёная галочка и зачёркнутый заголовок. */
  completed?: boolean
  /** Блокирует взаимодействие, пока идёт «серверное» сохранение. */
  disabled?: boolean
  /** Read-only режим публичной доски: без ручки и открытия карточки. */
  readOnly?: boolean
  /** Участники доски — источник аватара исполнителя. */
  members?: BoardMember[]
  /** Идентификатор текущего пользователя — его задачи помечаются «Вы». */
  currentUserId?: string | null
  onOpen: (task: TaskCardModel) => void
  /** Включён ли режим перетаскивания (drag-and-drop — единственный способ перемещения). */
  draggable?: boolean
}

const priorityLabels: Record<TaskPriority, string> = {
  low: 'Low',
  medium: 'Medium',
  high: 'High',
  critical: 'Critical',
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
 * Карточка задачи: приоритет, заголовок, описание (до трёх строк), теги,
 * дедлайн и исполнитель с аватаром. Клик по карточке открывает подробности;
 * перемещение между колонками — через drag-and-drop за ручку (у ручки есть
 * клавиатурная альтернатива: сенсор dnd-kit поддерживает перетаскивание
 * с клавиатуры).
 */
export function TaskCard({
  task,
  column,
  completed = false,
  disabled = false,
  readOnly = false,
  members,
  currentUserId = null,
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
  const isMine = currentUserId !== null && task.assigneeId === currentUserId
  const assigneeName = task.assigneeName ?? null
  const assigneeMember = task.assigneeId
    ? members?.find((member) => member.userId === task.assigneeId)
    : undefined
  const assigneeAvatarUrl = assigneeMember?.avatarUrl ?? null
  // Имя берём из участников: assigneeName в карточке мог остаться от прежнего
  // исполнителя, сервер обновит его только при следующем сохранении доски.
  const assigneeDisplayName = isMine ? 'Вы' : assigneeMember?.displayName ?? assigneeName

  return (
    <article
      ref={setNodeRef}
      className={`kb-task${completed ? ' kb-task--done' : ''}${isDragging ? ' kb-task--dragging' : ''}${
        readOnly ? '' : ' kb-task--clickable'
      }`}
      data-task-id={task.id}
      aria-label={`Задача: ${task.title}${completed ? ' (завершена)' : ''}${isMine ? ' — назначена вам' : ''}`}
      onClick={readOnly ? undefined : () => onOpen(task)}
    >
      <div className="kb-task__head">
        {completed ? (
          <span className="kb-task__check" title="Задача завершена" aria-hidden="true">
            <CheckIcon />
          </span>
        ) : null}
        <StatusBadge tone={priorityTones[task.priority]} withDot>
          {priorityLabels[task.priority]}
        </StatusBadge>
        {!readOnly ? (
          <button
            ref={setActivatorNodeRef}
            type="button"
            className="kb-task__drag"
            aria-label={`Перетащить задачу «${task.title}» в другую колонку`}
            disabled={disabled || !draggable}
            onClick={(event) => event.stopPropagation()}
            {...attributes}
            {...listeners}
          >
            <DragIndicatorIcon />
          </button>
        ) : null}
      </div>

      {readOnly ? (
        <span className="kb-task__title-static">{task.title}</span>
      ) : (
        <button
          type="button"
          className="kb-task__title"
          onClick={(event) => {
            event.stopPropagation()
            onOpen(task)
          }}
        >
          {task.title}
        </button>
      )}

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

      <div className="kb-task__foot">
        {assigneeName ? (
          <span
            className={isMine ? 'kb-task__assignee kb-task__assignee--mine' : 'kb-task__assignee'}
            title={isMine ? 'Задача назначена вам' : 'Исполнитель'}
          >
            {assigneeAvatarUrl ? (
              <img className="kb-task__assignee-avatar" src={assigneeAvatarUrl} alt="" />
            ) : (
              <span className="kb-task__assignee-avatar" aria-hidden="true">
                {getInitials(assigneeName)}
              </span>
            )}
            {assigneeDisplayName}
          </span>
        ) : null}
        {task.dueDate ? (
          <span
            className={
              overdue
                ? 'kb-task__meta-item kb-task__date kb-task__meta-item--overdue'
                : 'kb-task__meta-item kb-task__date'
            }
            title={overdue ? 'Просрочено' : 'Дедлайн'}
          >
            <CalendarIcon />
            {formatDue(task.dueDate)}
          </span>
        ) : null}
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
