import { useNavigate } from 'react-router'
import { EmptyState } from '@kanbex/ui'

/** Страница для неизвестных клиентских маршрутов. */
export function NotFoundPage() {
  const navigate = useNavigate()

  return (
    <div className="kb-page">
      <EmptyState
        title="Страница не найдена"
        description="Такого маршрута в клиентском приложении нет. Вернитесь к списку досок или на страницу входа."
        actionLabel="К доскам"
        onAction={() => navigate('/boards')}
        secondaryAction={
          <button type="button" className="kb-link-button" onClick={() => navigate('/login')}>
            На страницу входа
          </button>
        }
      />
    </div>
  )
}
