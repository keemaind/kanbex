import { useState } from 'react'
import type { FormEvent } from 'react'

import { AppDatePickerField, AppDialog, AppOption, AppSelect, AppTextField } from '@kanbex/ui'

import { toApiDate } from './taskDates.js'

import type { NewTaskInput } from './boardLogic.js'
import type { BoardMember, TaskPriority } from '../../types/index.js'

export interface TaskCreateDialogProps {
  /** Название колонки, в которую попадёт карточка. */
  columnTitle: string
  /** Участники доски — варианты исполнителя. */
  members?: BoardMember[]
  onCreate: (input: NewTaskInput) => void
  onCancel: () => void
}

const priorities: Array<{ value: TaskPriority; label: string }> = [
  { value: 'low', label: 'Низкий' },
  { value: 'medium', label: 'Средний' },
  { value: 'high', label: 'Высокий' },
  { value: 'critical', label: 'Критический' },
]

const NO_ASSIGNEE = ''

/**
 * Диалог создания задачи. Проверяет только форму; WIP-лимит и позицию
 * повторно проверяет `addTaskToColumn`, чтобы правило не зависело от UI.
 */
export function TaskCreateDialog({ columnTitle, members, onCreate, onCancel }: TaskCreateDialogProps) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [priority, setPriority] = useState<TaskPriority>('medium')
  const [assigneeId, setAssigneeId] = useState(NO_ASSIGNEE)
  const [dueDate, setDueDate] = useState<Date | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = (event?: FormEvent<HTMLFormElement>) => {
    event?.preventDefault()

    const trimmedTitle = title.trim()

    if (trimmedTitle.length < 2) {
      setError('Название должно содержать минимум 2 символа.')

      return
    }

    const assignee = members?.find((member) => member.userId === assigneeId) ?? null

    setError(null)
    onCreate({
      title: trimmedTitle,
      description: description.trim(),
      priority,
      assigneeId: assignee?.userId ?? null,
      assigneeName: assignee?.displayName ?? null,
      dueDate: toApiDate(dueDate),
    })
  }

  return (
    <AppDialog
      open
      className="kb-dialog--wide"
      title="Новая задача"
      description={`Карточка появится в колонке «${columnTitle}».`}
      confirmLabel="Создать задачу"
      onConfirm={() => handleSubmit()}
      onCancel={onCancel}
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
          supportingText="Например: «Настроить WIP-лимит колонки»."
          maxLength={120}
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
          rows={3}
          maxLength={500}
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
        <div className="kb-form__row">
          <AppDatePickerField
            label="Дедлайн"
            name="taskDueDate"
            value={dueDate}
            onChange={setDueDate}
            locale="ru-RU"
            supportingText="Необязательно."
          />
        </div>
      </form>
    </AppDialog>
  )
}
