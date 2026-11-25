import { useState } from 'react'
import type { FormEvent } from 'react'
import { AppButton, AppDatePickerField, AppDialog, AppOption, AppSelect, AppTextField } from '@kanbex/ui'
import type { BoardColumn as BoardColumnModel, BoardMember, Tag, TaskCard, TaskPriority } from '../../types/index.js'
import { TaskComments } from './TaskComments.js'
import { TagPicker } from './TagPicker.js'
import { TaskHistory } from './TaskHistory.js'
import { fromApiDate, toApiDate } from './taskDates.js'

export interface TaskEditValues {
  title: string
  description: string
  priority: TaskPriority
  assigneeId: string | null
  dueDate: string | null
  estimate: number | null
}

export interface TaskEditDialogProps {
  task: TaskCard
  columnTitle: string
  boardId: string
  columns: BoardColumnModel[]
  /** Участники доски — варианты исполнителя. */
  members?: BoardMember[]
  /** Текущий пользователь — автор удаляет свой комментарий. */
  currentUserId?: string | null
  /** Creator может удалить любой комментарий. */
  isCreator?: boolean
  /** Обновляет счётчик комментариев на карточке. */
  onCommentCountChange?: (count: number) => void
  /** Обновляет теги карточки после прикрепления/открепления. */
  onTagsChange?: (tags: Tag[]) => void
  onSave: (values: TaskEditValues) => void
  onDelete: () => void
  onCancel: () => void
}

const priorities: Array<{ value: TaskPriority; label: string }> = [
  { value: 'low', label: 'Низкий' },
  { value: 'medium', label: 'Средний' },
  { value: 'high', label: 'Высокий' },
  { value: 'critical', label: 'Критический' },
]

const NO_ASSIGNEE = ''

/** Редактирование карточки: поля, исполнитель, дедлайн, комментарии и история. */
export function TaskEditDialog({
  task,
  columnTitle,
  boardId,
  columns,
  members,
  currentUserId = null,
  isCreator = false,
  onCommentCountChange,
  onTagsChange,
  onSave,
  onDelete,
  onCancel,
}: TaskEditDialogProps) {
  const [title, setTitle] = useState(task.title)
  const [description, setDescription] = useState(task.description)
  const [priority, setPriority] = useState<TaskPriority>(task.priority)
  const [assigneeId, setAssigneeId] = useState(task.assigneeId ?? NO_ASSIGNEE)
  const [dueDate, setDueDate] = useState<Date | null>(() => fromApiDate(task.dueDate))
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = (event?: FormEvent<HTMLFormElement>) => {
    event?.preventDefault()

    const trimmedTitle = title.trim()
    if (trimmedTitle.length < 2) {
      setError('Название должно содержать минимум 2 символа.')
      return
    }

    setError(null)
    onSave({
      title: trimmedTitle,
      description: description.trim(),
      priority,
      assigneeId: assigneeId || null,
      dueDate: toApiDate(dueDate),
      estimate: task.estimate ?? null,
    })
  }

  return (
    <AppDialog
      open
      className="kb-dialog--wide"
      title="Карточка"
      description={`Колонка «${columnTitle}».`}
      confirmLabel="Сохранить"
      onConfirm={() => handleSubmit()}
      onCancel={onCancel}
      footerLeading={
        <AppButton variant="text" onClick={onDelete}>
          Удалить карточку
        </AppButton>
      }
    >
      <form className="kb-form" onSubmit={handleSubmit}>
        <AppTextField
          label="Название задачи"
          name="taskTitle"
          value={title}
          onChange={(event) => {
            setTitle(event.target.value)
            if (error) setError(null)
          }}
          error={Boolean(error)}
          errorText={error ?? undefined}
          maxLength={200}
          required
          inputProps={{ autoFocus: true }}
        />
        <AppTextField
          label="Описание"
          name="taskDescription"
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          supportingText="Необязательно: что нужно сделать и как понять, что готово."
          multiline
          rows={4}
          maxLength={2000}
        />
        <div className="kb-form__row">
          <AppSelect
            label="Приоритет"
            name="taskPriority"
            value={priority}
            onChange={(_, value) => setPriority(value as TaskPriority)}
            fullWidth
          >
            {priorities.map((option) => (
              <AppOption key={option.value} value={option.value}>
                {option.label}
              </AppOption>
            ))}
          </AppSelect>
          <AppSelect
            label="Исполнитель"
            name="taskAssignee"
            value={assigneeId}
            onChange={(_, value) => setAssigneeId(String(value))}
            fullWidth
          >
            <AppOption value={NO_ASSIGNEE}>Не назначен</AppOption>
            {(members ?? []).map((member) => (
              <AppOption key={member.userId} value={member.userId}>
                {member.displayName}
                {member.role === 'creator' ? ' — владелец' : ''}
              </AppOption>
            ))}
          </AppSelect>
        </div>
        <AppDatePickerField
          label="Дедлайн"
          name="taskDueDate"
          value={dueDate}
          onChange={setDueDate}
          locale="ru-RU"
          supportingText="Необязательно."
        />
      </form>
      <section className="kb-task-extras" aria-label="Теги карточки">
        <h3 className="kb-task-extras__title">Теги</h3>
        <TagPicker
          boardId={boardId}
          task={task}
          isCreator={isCreator}
          onTagsChange={(tags) => onTagsChange?.(tags)}
        />
      </section>
      <section className="kb-task-extras" aria-label="Комментарии">
        <h3 className="kb-task-extras__title">Комментарии</h3>
        <TaskComments
          boardId={boardId}
          taskId={task.id}
          currentUserId={currentUserId}
          isCreator={isCreator}
          onCountChange={(count) => onCommentCountChange?.(count)}
        />
      </section>
      <section className="kb-task-extras" aria-label="История карточки">
        <h3 className="kb-task-extras__title">История</h3>
        <TaskHistory boardId={boardId} taskId={task.id} columns={columns} members={members} />
      </section>
    </AppDialog>
  )
}
