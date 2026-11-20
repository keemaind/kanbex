import { useState } from 'react'
import type { FormEvent } from 'react'
import { AppDialog, AppOption, AppSelect, AppTextField } from '@kanbex/ui'
import type { TaskPriority } from '../../types/index.js'
import type { NewTaskInput } from './boardLogic.js'

export interface TaskCreateDialogProps {
  /** Название колонки, в которую попадёт карточка. */
  columnTitle: string
  onCreate: (input: NewTaskInput) => void
  onCancel: () => void
}

const priorities: Array<{ value: TaskPriority; label: string }> = [
  { value: 'low', label: 'Низкий' },
  { value: 'medium', label: 'Средний' },
  { value: 'high', label: 'Высокий' },
  { value: 'critical', label: 'Критический' },
]

/**
 * Диалог создания задачи. Проверяет только форму; WIP-лимит и позицию
 * повторно проверяет `addTaskToColumn`, чтобы правило не зависело от UI.
 */
export function TaskCreateDialog({ columnTitle, onCreate, onCancel }: TaskCreateDialogProps) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [priority, setPriority] = useState<TaskPriority>('medium')
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = (event?: FormEvent<HTMLFormElement>) => {
    event?.preventDefault()

    const trimmedTitle = title.trim()
    if (trimmedTitle.length < 2) {
      setError('Название должно содержать минимум 2 символа.')
      return
    }

    setError(null)
    onCreate({ title: trimmedTitle, description: description.trim(), priority })
  }

  return (
    <AppDialog
      open
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
    </AppDialog>
  )
}
