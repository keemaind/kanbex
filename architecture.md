# Архитектурные требования Kanbex

## 1. Назначение и принципы

Kanbex — учебный цифровой симулятор Kanban-системы для изучения визуализации потока работ, ограничения незавершённой работы (WIP) и управления задачами. ASP.NET Core обслуживает MVC-страницы и HTTP API; React предоставляет интерактивный интерфейс, встроенный в Razor-страницу.

Архитектура разделяет отображение, HTTP/API, бизнес-сущности и доступ к данным. Сервер является источником истины для досок. Клиент не обращается к базе напрямую. Учётные записи и защита личных данных реализуются через ASP.NET Core Identity.

В решении должно быть более одного проекта, как минимум основное приложение и библиотека общих компонентов. Для ясного разделения серверного доступа к данным предусматривается отдельный инфраструктурный проект.

## 2. Технологический стек

- **Backend и веб-хост:** ASP.NET Core MVC на C# / .NET 10.
- **HTTP API:** контроллеры ASP.NET Core Web API в основном серверном приложении.
- **Frontend:** React + TypeScript, сборка Vite, встраивание в Razor через `TechGems.ViteDotNet`.
- **UI:** `m3-expressive-react` и внутренняя библиотека общих компонентов `@kanbex/ui`.
- **ORM:** Entity Framework Core 10.
- **Создание модели БД:** Code First — сущности и конфигурация EF Core описывают схему.
- **Версионирование схемы:** EF Core Migrations; миграции хранятся в инфраструктурном проекте.
- **База данных:** SQLite для простого локального запуска и учебного MVP.
- **Аутентификация и авторизация:** ASP.NET Core Identity с хранением пользователей через EF Core и cookie-аутентификацией для same-origin веб-приложения/API.

## 3. Структура решения и репозитория

Целевая структура ниже создана как каркас: существующий MVC-проект перемещён в `src/Kanbex.Web`, добавлены проекты `Kanbex.Infrastructure` и `Kanbex.UI`, а также решение `Kanbex.sln`. Папки под будущие слои и компоненты пока содержат только `.gitkeep`; API, Identity, EF Core, сущности и UI-компоненты ещё не реализованы. Тестовые проекты оставлены на следующий этап.

```text
/
├── architecture.md
├── mvp.md
├── Kanbex.sln
├── src/
│   ├── Kanbex.Web/                         # MVC, HTTP API и React-хост
│   │   ├── Controllers/
│   │   │   ├── HomeController.cs           # MVC-страницы
│   │   │   ├── BoardPageController.cs       # MVC-хост React для доски
│   │   │   └── Api/
│   │   │       ├── AuthController.cs        # API регистрации, входа и сессии
│   │   │       └── BoardsController.cs      # API досок, колонок и карточек
│   │   ├── Views/
│   │   │   ├── Home/Index.cshtml
│   │   │   ├── Board/Index.cshtml           # Razor-хост React-острова
│   │   │   ├── Shared/_Layout.cshtml
│   │   │   └── _ViewImports.cshtml
│   │   ├── ReactApp/
│   │   │   ├── src/
│   │   │   │   ├── app/                     # корень React и провайдеры
│   │   │   │   ├── pages/                   # страницы клиентского приложения
│   │   │   │   ├── features/
│   │   │   │   │   ├── auth/                # формы Identity и состояние сессии
│   │   │   │   │   ├── boards/              # доски, колонки, задачи, WIP
│   │   │   │   │   └── learning/            # обучающие подсказки
│   │   │   │   ├── routes/                  # React Router
│   │   │   │   ├── services/                # типизированные HTTP API-клиенты
│   │   │   │   ├── types/                   # DTO и UI-типы
│   │   │   │   └── main.tsx                 # точка входа React
│   │   │   ├── package.json
│   │   │   ├── tsconfig.json
│   │   │   └── vite.config.ts
│   │   ├── wwwroot/ReactApp/                # генерируемые Vite-бандлы/манифесты
│   │   ├── Program.cs                       # DI, MVC, API, Identity, middleware
│   │   ├── appsettings.json                 # конфигурация и строка SQLite
│   │   └── Kanbex.Web.csproj
│   ├── Kanbex.Infrastructure/                # EF Core, SQLite и Identity persistence
│   │   ├── Persistence/
│   │   │   ├── KanbexDbContext.cs            # IdentityDbContext и доменные DbSet
│   │   │   ├── Configurations/               # IEntityTypeConfiguration<T>
│   │   │   └── Migrations/                   # EF Core migrations
│   │   ├── Identity/
│   │   │   └── ApplicationUser.cs            # расширение IdentityUser при необходимости
│   │   └── Kanbex.Infrastructure.csproj
│   └── Kanbex.UI/                            # библиотека общих React-компонентов
│       ├── src/
│       │   ├── components/
│       │   │   ├── AppButton/
│       │   │   ├── AppDialog/
│       │   │   ├── AppHeader/
│       │   │   ├── EmptyState/
│       │   │   ├── LoadingState/
│       │   │   └── StatusBadge/
│       │   ├── styles/
│       │   ├── index.ts                      # публичные экспорты
│       │   └── types.ts
│       ├── package.json                      # пакет @kanbex/ui
│       ├── tsconfig.json
│       └── README.md
├── package.json                              # npm workspaces
└── package-lock.json
```

`ReactApp` находится внутри `Kanbex.Web`, чтобы плагин `vite-dotnet` публиковал сборку в `wwwroot/ReactApp`. `Kanbex.UI` является отдельным npm workspace-пакетом. `Kanbex.Infrastructure` — отдельный .NET-проект, на который ссылается `Kanbex.Web`. Папки для будущего API, приложения React, persistence и компонентов созданы как placeholders и пока не содержат реализации.

## 4. Проекты и ответственность

### 4.1. Kanbex.Web — основное приложение

**Назначение:** MVC-страницы, Web API, аутентификация/авторизация, композиция зависимостей и интеграция React с Razor.

- MVC-контроллеры возвращают Razor-страницы-хосты.
- API-контроллеры принимают и проверяют DTO, вызывают серверную логику и возвращают HTTP-ответы. Контроллеры не содержат SQL и сложных доменных правил.
- ASP.NET Core Identity регистрирует пользователей, создаёт/завершает сессии и предоставляет текущего пользователя.
- `[Authorize]` и проверка владельца защищают личные доски и каждую операцию API.
- React-клиент получает и изменяет данные только через API.
- `Program.cs` конфигурирует MVC, API, Identity, EF Core SQLite, middleware и ViteDotNet.

Основные страницы и клиентские компоненты:

- `HomeController` / `Home/Index.cshtml` — текущая вводная MVC-страница.
- В будущем добавятся `BoardPageController`, `App` / `AppRouter`, страницы учётной записи и досок, Kanban-компоненты и типизированные API-клиенты; они пока не входят в каркас.

### 4.2. Kanbex.Infrastructure — EF Core и Identity persistence

**Назначение:** EF Core DbContext, конфигурация сущностей, SQLite и миграции.

- `KanbexDbContext` наследуется от `IdentityDbContext<ApplicationUser>` и содержит доменные `DbSet`.
- `ApplicationUser` расширяет Identity-пользователя только необходимыми полями.
- Конфигурации сущностей задаются Fluent API в `Persistence/Configurations/`.
- EF Core Code First migrations создают и обновляют схему SQLite; изменения схемы в обход миграций запрещены.
- Connection string задаётся конфигурацией `Kanbex.Web`. Локальный файл базы не включается в исходный контроль версий, если не является специально подготовленным демо-артефактом.
- Базовые сущности: `Board` (владелец, название и метаданные), `BoardColumn` (доска, название, порядок, WIP-лимит), `TaskCard` (колонка, заголовок, описание, приоритет, порядок). Доска принадлежит одному Identity-пользователю; внешние связи настраиваются явно.
- В локальной разработке миграции применяются через `dotnet ef database update`. Автоматическое применение при старте допустимо для учебной среды; для развёртывания предпочтительны контролируемые миграции.

### 4.3. Kanbex.UI — библиотека общих React-компонентов

**Назначение:** повторно используемые и доступные визуальные компоненты без доменной логики, API, Identity и зависимости от роутера.

- `AppButton` — единая кнопка, использующая подходящие варианты `m3-expressive-react`.
- `AppDialog` — диалог подтверждения или простой информационный диалог.
- `AppHeader` — общая верхняя панель.
- `EmptyState` — пустое состояние с объяснением и действием.
- `LoadingState` — индикация ожидания.
- `StatusBadge` — метка приоритета/статуса.

Публичный API экспортируется из `src/index.ts`. Компоненты получают данные через props и вызывают callbacks. Библиотека не выполняет fetch, не обращается к Identity/хранилищу и не содержит правил Kanban. `BoardColumn` и `TaskCard` остаются в feature-коде основного приложения.

## 5. API и взаимодействие

API размещается в `Kanbex.Web` под префиксом `/api`. Web API-контроллеры работают с DTO, валидируют входные данные, применяют правила доступа и используют EF Core через серверную инфраструктуру. Серверная авторизация обязательна даже при наличии клиентских проверок маршрутов.

Предлагаемые маршруты MVP:

| Метод и маршрут | Доступ | Назначение |
|---|---|---|
| `POST /api/auth/register` | Анонимный | Создать учётную запись; установить cookie-сессию или потребовать отдельный вход согласно выбранному сценарию. |
| `POST /api/auth/login` | Анонимный | Проверить учётные данные и создать cookie-сессию. |
| `POST /api/auth/logout` | Аутентифицированный | Завершить сессию; учитывать защиту от CSRF. |
| `GET /api/auth/me` | Аутентифицированный | Получить безопасный DTO текущего пользователя. |
| `GET /api/boards` | Аутентифицированный | Получить только доски текущего пользователя. |
| `POST /api/boards` | Аутентифицированный | Создать личную доску с начальными колонками/демо-данными. |
| `GET /api/boards/{boardId}` | Аутентифицированный + владелец | Получить доску, колонки и карточки. |
| `PUT /api/boards/{boardId}` | Аутентифицированный + владелец | Сохранить изменения; сервер проверяет WIP-правила. |
| `DELETE /api/boards/{boardId}` | Аутентифицированный + владелец | Удалить доску, если это действие включено в согласованный MVP. |

Для cookie-аутентификации React и API работают на одном origin. Изменяющие состояние запросы защищаются от CSRF, например antiforgery-токеном и настройкой cookie. CORS не включается без необходимости. API не возвращает хэши паролей или другие секреты Identity. Точные DTO, коды ошибок и правила конфликтов определяются при реализации.

## 6. Интеграция React, Razor и Vite

- `Kanbex.Web/Program.cs` регистрирует MVC, API и `AddViteIntegration(builder.Configuration)`.
- `Views/_ViewImports.cshtml` подключает MVC tag helpers и `@addTagHelper *, ViteDotNet`.
- `appsettings.json` задаёт имя SPA-папки: `"ViteDotNet": "ReactApp"`.
- `ReactApp/vite.config.ts` использует React-плагин и `ViteDotNetPlugin('src/main.tsx', 'root')`.
- Razor-представление содержит единственный `<div id="root"></div>` и выбирает `<dev-vite-scripts>` в Development или `<prod-vite-scripts>` в Production.
- В Development React-модули обслуживает Vite dev server с HMR. В Production Vite формирует бандлы и манифесты в `wwwroot/ReactApp`; ASP.NET Core отдаёт их как статические файлы.
- React управляет DOM внутри `#root`; MVC/Razor остаётся серверным хостом страницы.

## 7. Библиотеки и версии

Текущие версии указаны по существующему каркасу и его lock-файлу. Предлагаемые версии нужно сверить с совместимостью на момент реализации и зафиксировать в lock-файле; не использовать плавающий `latest`.

| Библиотека / платформа | Версия | Проект | Назначение |
|---|---:|---|---|
| .NET / ASP.NET Core | 10.0 | `Kanbex.Web` | MVC, Razor, Web API, Identity и серверная часть. |
| Entity Framework Core | 10.0.x | `Kanbex.Infrastructure` | ORM, SQLite provider, Code First и миграции. Версии пакетов EF Core должны совпадать по major/minor. |
| ASP.NET Core Identity | 10.0.x | `Kanbex.Web`, `Kanbex.Infrastructure` | Пользователи, проверка паролей, cookie-сессии и авторизация. |
| SQLite | версия провайдера `Microsoft.EntityFrameworkCore.Sqlite` 10.0.x | `Kanbex.Infrastructure` | Простая локальная реляционная БД; версией SQLite управляет совместимый EF Core provider. |
| `TechGems.ViteDotNet` | 1.0.0 | `Kanbex.Web` | Tag Helpers и интеграция Vite с Razor. |
| Node.js | 24.x (текущее окружение разработки) | frontend | Запуск npm и инструментов сборки. |
| React / React DOM | 19.3.1 (текущий lock) | `ReactApp`, `Kanbex.UI` | Компонентный UI и монтирование в DOM. |
| TypeScript | 7.0.2 (текущий lock) | frontend | Типизация клиентского кода. |
| Vite | 8.3.8 (текущий lock) | `ReactApp` | Dev server, HMR и production-сборка. |
| `@vitejs/plugin-react` | 6.3.0 (текущий lock) | `ReactApp` | Поддержка React и Fast Refresh в Vite. |
| `vite-dotnet` | 1.0.0 | `ReactApp` | Vite-плагин манифестов и публикации сборки; версия согласуется с NuGet-пакетом. |
| `m3-expressive-react` | 1.8.2 (текущий lock) | `Kanbex.UI` / `ReactApp` | Компоненты Material 3 Expressive и ThemeProvider; корневой entrypoint импортирует `styles.css`. |
| `react-router` | 7.18.5 (предлагаемая) | `ReactApp` | Клиентская маршрутизация и защищённые представления UX-уровня. |
| `@dnd-kit/core` | 6.3.1 (предлагаемая) | `ReactApp` | Drag-and-drop карточек. |
| `@dnd-kit/sortable` | 10.0.0 (предлагаемая) | `ReactApp` | Сортировка; совместимость с `@dnd-kit/core` сверить при установке. |
| `@testing-library/react` | 16.3.3 (предлагаемая) | frontend | Тестирование поведения React-компонентов. |
| Vitest | 5.1.0 (предлагаемая) | frontend | Клиентские модульные тесты; сверить поддержку выбранного Vite. |
| xUnit | актуальная стабильная версия на момент реализации | `tests/` | Unit- и интеграционные тесты .NET-проектов. |
| `Microsoft.AspNetCore.Mvc.Testing` | 10.0.x | `Kanbex.Web.Tests` | Интеграционное тестирование MVC/API с тестовым хостом. |

`Kanbex.UI` использует React и `m3-expressive-react` как peer/workspace-зависимости, чтобы не включать дубли React. Точная конфигурация peer dependencies фиксируется при настройке npm workspace.

## 8. Роутинг и авторизация

### 8.1. MVC-маршруты

| URL | MVC-действие | Назначение | Доступ |
|---|---|---|---|
| `/` | `HomeController.Index` | Вводная страница и переход к симулятору. | Открытый |
| `/board` | `BoardPageController.Index` | Razor-хост React для досок/списка досок. | Аутентифицированный; при необходимости допускается открытая вводная доска отдельно. |
| `/board/{boardId:guid}` | `BoardPageController.Details` | Хост доски; идентификатор передаётся React и API. | Аутентифицированный, владелец проверяется сервером. |
| `/Identity/Account/Login` | Identity UI | Вход. | Открытый |
| `/Identity/Account/Register` | Identity UI | Регистрация. | Открытый |
| `/Identity/Account/Logout` | Identity UI/API | Выход. | Аутентифицированный, POST/защищённый запрос |
| `/account` | MVC или SPA-хост | Профиль пользователя. | `[Authorize]` |

### 8.2. API-маршруты

API-маршруты перечислены в разделе 5 и имеют префикс `/api`. Доступ контролируется на сервере с помощью Identity, `[Authorize]` и проверки владельца ресурса.

### 8.3. React Router и параметры

Внутри React-приложения `BrowserRouter` отображает страницы входа/регистрации, список досок и представление доски. Основные клиентские пути: `/login`, `/register`, `/boards` и `/boards/:boardId`. `boardId` валидируется; авторитетный ответ о существовании и доступе возвращает Web API. Клиентский guard нужен для навигации и перенаправления на `/login`, но не заменяет серверную авторизацию.

При прямом открытии URL ASP.NET Core должен вернуть подходящий Razor-хост для клиентского маршрута (или использовать серверные MVC-маршруты с параметром). Все операции чтения/записи независимо защищены API.

## 9. Как приложение использует Kanbex.UI

`ReactApp` подключает `@kanbex/ui` как локальную workspace-зависимость и импортирует общие компоненты из публичного API:

```tsx
import { AppButton, AppDialog, EmptyState, StatusBadge } from '@kanbex/ui'
```

Библиотека отвечает только за переиспользуемое представление и доступность. Приложение передаёт props и callbacks. Доменные правила, маршрутизация, API-вызовы и состояние досок остаются в `Kanbex.Web/ReactApp`; библиотека не знает о текущем пользователе, Identity или структуре БД.
