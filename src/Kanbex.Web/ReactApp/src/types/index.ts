/** DTO и UI-типы клиентского приложения Kanbex. */

/** Приоритет карточки. */
export type TaskPriority = 'low' | 'medium' | 'high' | 'critical'

/** Роль участника доски. */
export type ProjectRole = 'creator' | 'member'

/** Тип события истории карточки. */
export type TaskHistoryEventType = 'created' | 'updated' | 'moved' | 'assigned'

/** Тег из каталога доски. */
export interface Tag {
  id: string
  name: string
  /** Цвет в формате #RRGGBB. */
  color: string
}

/** Карточка задачи на доске. */
export interface TaskCard {
  id: string
  title: string
  description: string
  priority: TaskPriority
  /** Порядок внутри колонки. */
  order: number
  /** Идентификатор исполнителя; `null`/`undefined` — не назначен. */
  assigneeId?: string | null
  assigneeName?: string | null
  /** Дедлайн в формате ISO; `null`/`undefined` — не задан. */
  dueDate?: string | null
  /** Оценка в условных единицах, 0–1000. */
  estimate?: number | null
  tags?: Tag[]
  commentCount?: number
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
  /** Роль текущего пользователя на доске. */
  role: ProjectRole
  /** Доска доступна анонимно по `/share/{id}`. */
  isPublic: boolean
  columns: BoardColumn[]
}

/** Краткое описание доски для списка. */
export interface BoardSummary {
  id: string
  title: string
  description: string
  taskCount: number
  columnCount: number
  /** Время последнего сохранения доски. */
  updatedAt: string
  /** Карточки в последней колонке — этапе «Готово». */
  completedTaskCount: number
  role: ProjectRole
  isPublic: boolean
}

/** Участник доски. */
export interface BoardMember {
  userId: string
  displayName: string
  role: ProjectRole
  /** Дата добавления в формате ISO. */
  joinedAt: string
}

/** Комментарий к карточке. */
export interface Comment {
  id: string
  taskId: string
  content: string
  authorId: string
  authorName: string
  /** Дата создания в формате ISO. */
  createdAt: string
}

/** Запись истории карточки. */
export interface TaskHistoryEntry {
  id: string
  taskId: string
  eventType: TaskHistoryEventType
  changedById: string
  changedByName: string
  oldColumnId: string | null
  newColumnId: string | null
  /** Человекочитаемое описание изменений. */
  details: string | null
  /** Дата события в формате ISO. */
  changedAt: string
}

/** Карточка публичной read-only доски. */
export interface PublicBoardTask {
  id: string
  title: string
  description: string
  priority: TaskPriority
  order: number
  assigneeName: string | null
  dueDate: string | null
  estimate: number | null
  tags: Tag[]
}

/** Колонка публичной read-only доски. */
export interface PublicBoardColumn {
  id: string
  title: string
  wipLimit: number | null
  order: number
  tasks: PublicBoardTask[]
}

/** Публичная read-only доска без приватных данных. */
export interface PublicBoard {
  id: string
  title: string
  description: string
  columns: PublicBoardColumn[]
}

/** Текущий пользователь (безопасный DTO). */
export interface CurrentUser {
  id: string
  displayName: string
  email: string
  /** Относительный URL аватара; `null` — аватар не загружен. */
  avatarUrl: string | null
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

/** Результат проверки WIP-лимита. */
export interface WipState {
  limit: number | null
  used: number
  isAtLimit: boolean
  isOverLimit: boolean
}
