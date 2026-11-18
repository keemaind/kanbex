import { useState } from 'react'
import type { FormEvent } from 'react'
import { TextField } from 'm3-expressive-react'
import { AppButton } from '@kanbex/ui'
import type { LoginRequest } from '../../types/index.js'

export interface LoginFormProps {
  onSubmit: (request: LoginRequest) => Promise<void>
  pending?: boolean
}

/** Форма входа. Валидирует поля на клиенте; сервер повторит проверки. */
export function LoginForm({ onSubmit, pending = false }: LoginFormProps) {
  const [email, setEmail] = useState('student@kanbex.local')
  const [password, setPassword] = useState('password123')
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!email.includes('@')) {
      setError('Укажите корректный e-mail.')
      return
    }
    if (password.length < 6) {
      setError('Пароль должен содержать минимум 6 символов.')
      return
    }
    setError(null)
    await onSubmit({ email, password })
  }

  return (
    <form className="kb-form" onSubmit={handleSubmit} noValidate>
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
        autoComplete="current-password"
        value={password}
        onChange={(event) => setPassword(event.target.value)}
        required
        error={Boolean(error)}
        errorText={error ?? undefined}
      />
      <AppButton type="submit" variant="filled" size="md" disabled={pending} fullWidth>
        {pending ? 'Вход…' : 'Войти'}
      </AppButton>
    </form>
  )
}
