/** DTO и UI-типы клиентского приложения Kanbex. */

/** Приоритет карточки. */
export type TaskPriority = 'low' | 'medium' | 'high' | 'critical'

/** Карточка задачи на доске. */
export interface TaskCard {
  id: string
  title: string
  description: string
  priority: TaskPriority
  /** Порядок внутри колонки. */
  order: number
}

/** Колонка доски. */
export interface BoardColumn {
  id: string
  title: string
  /** WIP-лимит; `null` — без ограничения. */
  wipLimit: number | null
  order: number
  tasks: TaskCard[]
}

/** Доска целиком. */
export interface Board {
  id: string
  title: string
  description: string
  /** Версия проекта для optimistic concurrency при сохранении. */
  version: number
  columns: BoardColumn[]
}

/** Краткое описание доски для списка. */
export interface BoardSummary {
  id: string
  title: string
  description: string
  taskCount: number
  columnCount: number
}

/** Текущий пользователь (безопасный DTO). */
export interface CurrentUser {
  id: string
  displayName: string
  email: string
}

/** Данные формы входа. */
export interface LoginRequest {
  email: string
  password: string
}

/** Данные формы создания проекта. */
export interface ProjectInput {
  title: string
  description: string
}

/** Данные формы регистрации. */
export interface RegisterRequest {
  displayName: string
  email: string
  password: string
}

/** Обучающая подсказка. */
export interface LearningTip {
  id: string
  title: string
  body: string
}

/** Результат проверки WIP-лимита. */
export interface WipState {
  limit: number | null
  used: number
  isAtLimit: boolean
  isOverLimit: boolean
}
