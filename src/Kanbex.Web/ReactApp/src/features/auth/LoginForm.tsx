import { useState } from 'react'
import type { FormEvent } from 'react'
import { AppButton, AppTextField } from '@kanbex/ui'
import type { LoginRequest } from '../../types/index.js'

export interface LoginFormProps {
  onSubmit: (request: LoginRequest) => Promise<void>
  pending?: boolean
  /** Ошибка сервера, полученная от `POST /api/auth/login`. */
  error?: string | null
}

/** Форма входа. Валидирует поля на клиенте; сервер повторит проверки. */
export function LoginForm({ onSubmit, pending = false, error = null }: LoginFormProps) {
  const [email, setEmail] = useState('student@kanbex.local')
  const [password, setPassword] = useState('Student1')
  const [fieldError, setFieldError] = useState<string | null>(null)

  const message = fieldError ?? error

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!email.includes('@')) {
      setFieldError('Укажите корректный e-mail.')
      return
    }
    if (password.length < 6) {
      setFieldError('Пароль должен содержать минимум 6 символов.')
      return
    }
    setFieldError(null)
    await onSubmit({ email: email.trim(), password })
  }

  return (
    <form className="kb-form" onSubmit={handleSubmit} noValidate>
      <AppTextField
        label="E-mail"
        type="email"
        name="email"
        autoComplete="username"
        value={email}
        onChange={(event) => setEmail(event.target.value)}
        required
      />
      <AppTextField
        label="Пароль"
        type="password"
        name="password"
        autoComplete="current-password"
        value={password}
        onChange={(event) => setPassword(event.target.value)}
        required
        error={Boolean(message)}
      />
      {message ? (
        <p className="kb-form__error" role="alert">
          {message}
        </p>
      ) : null}
      <AppButton type="submit" variant="filled" size="md" disabled={pending} fullWidth>
        {pending ? 'Вход…' : 'Войти'}
      </AppButton>
    </form>
  )
}
