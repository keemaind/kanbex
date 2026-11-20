import { useState } from 'react'
import type { FormEvent } from 'react'
import { TextField } from 'm3-expressive-react'
import { AppButton } from '@kanbex/ui'
import type { RegisterRequest } from '../../types/index.js'

export interface RegisterFormProps {
  onSubmit: (request: RegisterRequest) => Promise<void>
  pending?: boolean
  /** Ошибка сервера, полученная от `POST /api/auth/register`. */
  error?: string | null
}

/** Форма регистрации. Проверки повторяют политику паролей Identity. */
export function RegisterForm({ onSubmit, pending = false, error = null }: RegisterFormProps) {
  const [displayName, setDisplayName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fieldError, setFieldError] = useState<string | null>(null)

  const message = fieldError ?? error

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (displayName.trim().length < 2) {
      setFieldError('Укажите имя длиной не менее двух символов.')
      return
    }
    if (!email.includes('@')) {
      setFieldError('Укажите корректный e-mail.')
      return
    }
    if (password.length < 6) {
      setFieldError('Пароль должен содержать минимум 6 символов.')
      return
    }
    if (!/[0-9]/.test(password)) {
      setFieldError('Пароль должен содержать хотя бы одну цифру.')
      return
    }
    if (!/[a-z]/.test(password)) {
      setFieldError('Пароль должен содержать хотя бы одну строчную букву.')
      return
    }
    setFieldError(null)
    await onSubmit({ displayName: displayName.trim(), email: email.trim(), password })
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
        error={Boolean(message)}
      />
      {message ? (
        <p className="kb-form__error" role="alert">
          {message}
        </p>
      ) : null}
      <AppButton type="submit" variant="filled" size="md" disabled={pending} fullWidth>
        {pending ? 'Создание…' : 'Создать аккаунт'}
      </AppButton>
    </form>
  )
}
