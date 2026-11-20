/** Формат ошибок API: `ProblemDetails` с необязательными ошибками полей. */
export interface ApiProblem {
  type?: string
  title: string
  status: number
  detail?: string
  errors?: Record<string, string[]>
}

/** Ошибка API с HTTP-статусом и разобранным `ProblemDetails`. */
export class ApiError extends Error {
  readonly status: number
  readonly problem: ApiProblem

  constructor(problem: ApiProblem) {
    super(problem.detail ?? problem.title)
    this.name = 'ApiError'
    this.status = problem.status
    this.problem = problem
  }
}

/**
 * Читает `ProblemDetails` из ответа. Если тело не JSON, возвращает заголовок
 * по умолчанию, чтобы формы могли показать понятное сообщение.
 */
export async function toApiError(response: Response, fallback: string): Promise<ApiError> {
  let body: Partial<ApiProblem> | null = null
  try {
    body = (await response.json()) as Partial<ApiProblem>
  } catch {
    body = null
  }

  return new ApiError({
    type: typeof body?.type === 'string' ? body.type : undefined,
    title: typeof body?.title === 'string' && body.title ? body.title : fallback,
    status: typeof body?.status === 'number' ? body.status : response.status,
    detail: typeof body?.detail === 'string' ? body.detail : undefined,
    errors: body?.errors,
  })
}

/** Первое сообщение об ошибке, пригодное для показа в форме. */
export function describeApiError(error: unknown): string {
  if (error instanceof ApiError) {
    const fieldMessage = error.problem.errors
      ? Object.values(error.problem.errors).flat().find(Boolean)
      : undefined
    return fieldMessage ?? error.problem.detail ?? error.problem.title
  }

  if (error instanceof Error && error.message) {
    return error.message
  }

  return 'Не удалось выполнить запрос. Попробуйте ещё раз.'
}
