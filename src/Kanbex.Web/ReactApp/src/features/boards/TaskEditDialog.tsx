import { useState } from 'react'
import type { FormEvent } from 'react'
import { AppButton, AppDialog, AppOption, AppSelect, AppTextField } from '@kanbex/ui'
import type { TaskCard, TaskPriority } from '../../types/index.js'

export interface TaskEditValues {
  title: string
  description: string
  priority: TaskPriority
}

export interface TaskEditDialogProps {
  task: TaskCard
  columnTitle: string
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

/** Редактирование карточки: название, описание и приоритет. */
export function TaskEditDialog({ task, columnTitle, onSave, onDelete, onCancel }: TaskEditDialogProps) {
  const [title, setTitle] = useState(task.title)
  const [description, setDescription] = useState(task.description)
  const [priority, setPriority] = useState<TaskPriority>(task.priority)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = (event?: FormEvent<HTMLFormElement>) => {
    event?.preventDefault()

    const trimmedTitle = title.trim()
    if (trimmedTitle.length < 2) {
      setError('Название должно содержать минимум 2 символа.')
      return
    }

    setError(null)
    onSave({ title: trimmedTitle, description: description.trim(), priority })
  }

  return (
    <AppDialog
      open
      title="Карточка"
      description={`Колонка «${columnTitle}».`}
      confirmLabel="Сохранить"
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
      </form>
      <div className="kb-dialog__danger">
        <AppButton variant="text" onClick={onDelete}>
          Удалить карточку
        </AppButton>
      </div>
    </AppDialog>
  )
}
