import { useState } from 'react'
import type { FormEvent } from 'react'
import { TextField } from 'm3-expressive-react'
import { AppButton } from '@kanbex/ui'
import type { RegisterRequest } from '../../types/index.js'

export interface RegisterFormProps {
  onSubmit: (request: RegisterRequest) => Promise<void>
  pending?: boolean
}

/** Форма регистрации. */
export function RegisterForm({ onSubmit, pending = false }: RegisterFormProps) {
  const [displayName, setDisplayName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (displayName.trim().length < 2) {
      setError('Укажите имя длиной не менее двух символов.')
      return
    }
    if (!email.includes('@')) {
      setError('Укажите корректный e-mail.')
      return
    }
    if (password.length < 6) {
      setError('Пароль должен содержать минимум 6 символов.')
      return
    }
    setError(null)
    await onSubmit({ displayName: displayName.trim(), email, password })
  }

  return (
    <form className="kb-form" onSubmit={handleSubmit} noValidate>
      <TextField
        label="Имя"
        name="displayName"
        autoComplete="nickname"
        value={displayName}
        onChange={(event) => setDisplayName(event.target.value)}
        required
      />
      <TextField
        label="E-mail"
        type="email"
        name="email"
        autoComplete="username"
        value={email}
        onChange={(event) => setEmail(event.target.value)}
        required
      />
      <TextField
        label="Пароль"
        type="password"
        name="password"
        autoComplete="new-password"
        value={password}
        onChange={(event) => setPassword(event.target.value)}
        required
        error={Boolean(error)}
        errorText={error ?? undefined}
      />
      <AppButton type="submit" variant="filled" size="md" disabled={pending} fullWidth>
        {pending ? 'Создание…' : 'Создать аккаунт'}
      </AppButton>
    </form>
  )
}
