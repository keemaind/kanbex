import type { ReactNode } from 'react'
import { GitHubIcon } from '../app/icons.js'

const repositoryUrl = 'https://github.com/keemaind/kanbex'

/** Упрощённые SVG-знаки технологий: рисуются currentColor, поэтому
 *  реагируют на акцентный цвет темы так же, как иконка GitHub. */
function ReactIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true" focusable="false">
      <circle cx="12" cy="12" r="1.9" fill="currentColor" stroke="none" />
      <ellipse cx="12" cy="12" rx="9.5" ry="3.7" />
      <ellipse cx="12" cy="12" rx="9.5" ry="3.7" transform="rotate(60 12 12)" />
      <ellipse cx="12" cy="12" rx="9.5" ry="3.7" transform="rotate(120 12 12)" />
    </svg>
  )
}

function TypeScriptIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true" focusable="false">
      <rect x="3" y="3" width="18" height="18" rx="3" />
      <text
        x="12"
        y="15.5"
        textAnchor="middle"
        fontSize="8"
        fontWeight="700"
        fontFamily="inherit"
        fill="currentColor"
        stroke="none"
      >
        TS
      </text>
    </svg>
  )
}

function ViteIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      <path d="M13 2 4.8 13.4h4.7L8.4 22l9-11.8h-4.9z" />
    </svg>
  )
}

function DotNetIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true" focusable="false">
      <rect x="3" y="3" width="18" height="18" rx="3" />
      <text
        x="12"
        y="14.5"
        textAnchor="middle"
        fontSize="6.5"
        fontWeight="700"
        fontFamily="inherit"
        fill="currentColor"
        stroke="none"
      >
        .NET
      </text>
    </svg>
  )
}

function AspNetIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true" focusable="false">
      <rect x="4" y="4.5" width="16" height="6" rx="2" />
      <rect x="4" y="13.5" width="16" height="6" rx="2" />
      <path d="M7.5 7.5h.01M7.5 16.5h.01" strokeWidth="2.4" strokeLinecap="round" />
    </svg>
  )
}

function EfCoreIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      aria-hidden="true"
      focusable="false"
    >
      <path d="M10.5 13.5a4 4 0 0 0 5.7 0l3.2-3.2a4 4 0 1 0-5.7-5.7l-1.6 1.6" />
      <path d="M13.5 10.5a4 4 0 0 0-5.7 0l-3.2 3.2a4 4 0 1 0 5.7 5.7l1.6-1.6" />
    </svg>
  )
}

function SqliteIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true" focusable="false">
      <ellipse cx="12" cy="6" rx="7" ry="2.6" />
      <path d="M5 6v12c0 1.4 3.1 2.6 7 2.6s7-1.2 7-2.6V6" />
      <path d="M5 12c0 1.4 3.1 2.6 7 2.6s7-1.2 7-2.6" />
    </svg>
  )
}

function JestIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      <path d="M9.5 3h5M10.5 3v5.2L5.6 16.5A2.2 2.2 0 0 0 7.5 20h9a2.2 2.2 0 0 0 1.9-3.5L13.5 8.2V3" />
      <path d="M7.6 15h8.8" />
    </svg>
  )
}

function XUnitIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      <circle cx="12" cy="12" r="8.5" />
      <path d="m8.5 12.5 2.5 2.5 4.5-5" />
    </svg>
  )
}

const techStack: readonly { name: string; icon: ReactNode }[] = [
  { name: 'React 19', icon: <ReactIcon /> },
  { name: 'TypeScript', icon: <TypeScriptIcon /> },
  { name: 'Vite', icon: <ViteIcon /> },
  { name: '.NET 10', icon: <DotNetIcon /> },
  { name: 'ASP.NET Core', icon: <AspNetIcon /> },
  { name: 'EF Core', icon: <EfCoreIcon /> },
  { name: 'SQLite', icon: <SqliteIcon /> },
  { name: 'Jest', icon: <JestIcon /> },
  { name: 'xUnit', icon: <XUnitIcon /> },
]

/** Страница о проекте: краткое описание и технические детали. */
export function AboutPage() {
  return (
    <div className="kb-page kb-about">
      <h1 className="kb-page__title">О Kanbex</h1>
      <p className="kb-about__version">Версия {__APP_VERSION__}</p>

      <section className="kb-about__intro" aria-labelledby="kb-about-intro-title">
        <h2 className="kb-about__dev-title" id="kb-about-intro-title">
          Что такое Kanbex и зачем он нужен
        </h2>
        <p className="kb-about__intro-lead">
          Kanbex — учебный Kanban-симулятор: доска, на которой работа движется по
          этапам, а перегрузка видна сразу.
        </p>
        <dl className="kb-about__facts">
          <div>
            <dt>Что это</dt>
            <dd>Веб-доска с колонками, карточками, приоритетами и WIP-лимитами.</dd>
          </div>
          <div>
            <dt>Для кого</dt>
            <dd>
              Для студентов, разработчиков, менеджеров и личных планов — под каждый
              сценарий есть готовый шаблон доски.
            </dd>
          </div>
          <div>
            <dt>Для чего</dt>
            <dd>Вести проекты от идеи до результата и не держать в работе слишком много.</dd>
          </div>
          <div>
            <dt>Почему Kanban</dt>
            <dd>
              Ограничение незавершённой работы — самый наглядный способ увидеть
              «узкие места» и доводить задачи до конца.
            </dd>
          </div>
        </dl>
      </section>

      <section className="kb-about__dev" aria-labelledby="kb-about-dev-title">
        <h2 className="kb-about__dev-title" id="kb-about-dev-title">
          Для разработчиков
        </h2>
        <p className="kb-about__dev-text">
          Kanbex — open source. В репозитории лежат исходники сервера, клиента и
          тестов: фронтенд на React 19 + TypeScript (Vite, Jest), бэкенд на .NET 10
          с ASP.NET Core, Entity Framework Core и SQLite, интеграционные тесты на xUnit.
        </p>
        <a
          className="kb-about__github"
          href={repositoryUrl}
          target="_blank"
          rel="noreferrer"
          aria-label="Открыть репозиторий Kanbex на GitHub (в новой вкладке)"
        >
          <GitHubIcon />
          keemaind/kanbex
        </a>
        <ul className="kb-about__tech" aria-label="Технологии проекта">
          {techStack.map((tech) => (
            <li key={tech.name} className="kb-about__tech-item">
              {tech.icon}
              {tech.name}
            </li>
          ))}
        </ul>
      </section>
    </div>
  )
}
