/** Краткая страница о назначении симулятора. */
export function AboutPage() {
  return (
    <div className="kb-page kb-about">
      <h1 className="kb-page__title">О Kanbex</h1>
      <p className="kb-page__lead">
        Kanbex — учебный симулятор Kanban-потока. Он показывает, как визуализация
        этапов и WIP-лимит помогают замечать перегрузку и завершать начатое.
      </p>

      <div className="kb-about__grid">
        <section className="kb-about__card">
          <h2>Поток работы</h2>
          <p>
            Карточки проходят этапы слева направо. Колонка «В работе» ограничена
            WIP-лимитом: пока в ней нет свободного слота, следующую задачу туда не перенести.
          </p>
        </section>
        <section className="kb-about__card">
          <h2>Как это устроено</h2>
          <p>
            Сервер на ASP.NET Core хранит доски в SQLite, React-клиент работает через
            Web API, а общие компоненты собраны в библиотеке <code>@kanbex/ui</code>.
          </p>
        </section>
      </div>
    </div>
  )
}
