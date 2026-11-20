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

Структура решения включает `src/Kanbex.Web`, `src/Kanbex.Infrastructure`, `src/Kanbex.UI` и `Kanbex.sln`. Инфраструктурный проект содержит модель данных, конфигурации EF Core, Identity persistence и начальные миграции SQLite. Приложение содержит работающие MVC-хосты, React-страницы, переиспользуемые компоненты и серверное хранение досок. API аутентификации реализован через ASP.NET Core Identity, cookie-сессию и antiforgery; API досок поддерживает CRUD и сброс учебной доски к начальному содержимому. Для frontend-проектов настроены ESLint и Jest, юнит-тесты библиотеки компонентов, тесты сессии и логики доски; серверные интеграционные тесты покрывают `/api/auth/*` и `/api/boards/*`.

```text
/
├── architecture.md
├── mvp.md
├── README.md
├── Kanbex.sln
├── docs/
│   ├── kanbex-logo.svg                      # исходный логотип и палитра бренда
│   └── screenshots/                         # скриншоты работающего приложения для README
├── src/
│   ├── Kanbex.Web/                         # MVC, HTTP API и React-хост
│   │   ├── Controllers/
│   │   │   ├── HomeController.cs           # MVC-страницы и Razor-хосты SPA
│   │   │   └── Api/
│   │   │       ├── AuthController.cs       # Identity, cookie-сессия и antiforgery
│   │   │       └── BoardsController.cs     # CRUD досок и сброс учебной доски
│   │   ├── Contracts/
│   │   │   ├── AuthContracts.cs            # DTO входа, регистрации и CurrentUser
│   │   │   └── BoardContracts.cs           # DTO досок, колонок и карточек
│   │   ├── Services/
│   │   │   ├── BoardService.cs             # Бизнес-логика досок
│   │   │   └── ApiAntiforgeryFilter.cs     # CSRF для изменяющих /api/*
│   │   ├── Data/
│   │   │   └── DatabaseSeeder.cs           # Роли и демонстрационный пользователь
│   │   ├── Views/
│   │   │   ├── Home/Index.cshtml
│   │   │   ├── Home/Error.cshtml
│   │   │   ├── Board/Index.cshtml          # Razor-хост React-острова
│   │   │   ├── Shared/_Layout.cshtml
│   │   │   └── _ViewImports.cshtml
│   │   ├── ReactApp/
│   │   │   ├── src/
│   │   │   │   ├── app/                     # корень React, провайдеры и guard
│   │   │   │   ├── pages/                   # страницы клиентского приложения
│   │   │   │   ├── features/
│   │   │   │   │   ├── auth/                # формы Identity и состояние сессии
│   │   │   │   │   ├── boards/              # доски, WIP, тесты логики
│   │   │   │   │   └── learning/            # обучающие подсказки
│   │   │   │   ├── routes/                  # React Router
│   │   │   │   ├── services/                # типизированные HTTP API-клиенты
│   │   │   │   ├── types/                   # DTO и UI-типы
│   │   │   │   └── main.tsx                 # точка входа React
│   │   │   ├── public/
│   │   │   │   └── favicon.svg              # favicon для standalone Vite
│   │   │   ├── index.html                    # standalone-хост для `vite`/`npm run dev`
│   │   │   ├── package.json
│   │   │   ├── tsconfig.json
│   │   │   ├── vite.config.ts
│   │   │   ├── jest.config.cjs
│   │   │   ├── babel.config.cjs
│   │   │   └── eslint.config.js
│   │   ├── wwwroot/
│   │   │   ├── favicon.svg                   # иконка для Razor-хоста
│   │   │   └── ReactApp/                     # генерируемые Vite-бандлы/манифесты (игнорируются)
│   │   ├── Program.cs                       # DI, MVC, API, Identity, middleware
│   │   ├── appsettings.json                 # конфигурация и строка SQLite
│   │   └── Kanbex.Web.csproj
│   ├── Kanbex.Infrastructure/                # EF Core, SQLite и Identity persistence
│   │   ├── Domain/
│   │   │   ├── Entities/                      # Project, columns, tasks, history, comments, tags
│   │   │   └── Enums/                         # Роли участников, приоритеты, события истории
│   │   ├── Persistence/
│   │   │   ├── KanbexDbContext.cs            # IdentityDbContext и доменные DbSet
│   │   │   ├── Configurations/               # IEntityTypeConfiguration<T>
│   │   │   ├── Migrations/                   # EF Core migrations и model snapshot
│   │   │   └── KanbexDbContextFactory.cs      # Design-time создание контекста для dotnet ef
│   │   ├── Identity/
│   │   │   ├── ApplicationUser.cs            # Расширение IdentityUser
│   │   │   └── IdentityRoleNames.cs           # Имена глобальных ролей
│   │   └── Kanbex.Infrastructure.csproj
│   ├── Kanbex.UI/                            # библиотека общих React-компонентов
│   │   ├── src/
│   │   │   ├── components/
│   │   │   │   ├── AppButton/                # компонент и unit-тест
│   │   │   │   ├── AppDialog/                # компонент и unit-тест
│   │   │   │   ├── AppHeader/                # компонент и unit-тест
│   │   │   │   ├── EmptyState/               # компонент и unit-тест
│   │   │   │   ├── KanbexLogo/               # логотип и unit-тест
│   │   │   │   ├── LoadingState/             # компонент и unit-тест
│   │   │   │   └── StatusBadge/              # компонент и unit-тест
│   │   │   ├── styles/components.css          # токены --kb-color-* и стили компонентов
│   │   │   ├── test/setup.tsx                # cleanup и mock m3-expressive-react
│   │   │   ├── index.ts                      # публичные экспорты
│   │   │   └── types.ts
│   │   ├── package.json                      # пакет @kanbex/ui
│   │   ├── tsconfig.json
│   │   ├── jest.config.cjs
│   │   ├── babel.config.cjs
│   │   ├── eslint.config.js
│   │   └── README.md
│   └── Kanbex.Tests/                         # xUnit-тесты
│       ├── AuthApiTests.cs                   # Интеграционные тесты cookie-сессии и antiforgery
│       ├── BoardApiTests.cs                  # CRUD досок, WIP, перенос карточек и сброс
│       ├── BoardPersistenceTests.cs          # Сохранение досок через EF Core
│       ├── SpaHostTests.cs                   # Razor-хосты клиентских маршрутов
│       ├── KanbexApiFactory.cs               # TestServer с SQLite в памяти
│       ├── ApiControllerTests.cs
│       └── MigrationTests.cs
├── package.json                              # npm workspaces и общие команды
└── package-lock.json
```

`ReactApp` находится внутри `Kanbex.Web`, чтобы плагин `vite-dotnet` публиковал сборку в `wwwroot/ReactApp`. `Kanbex.UI` является отдельным npm workspace-пакетом. `Kanbex.Infrastructure` — отдельный .NET-проект, на который ссылается `Kanbex.Web`; в нём уже реализованы модель данных, конфигурации EF Core и миграции. `Kanbex.Tests` — xUnit-проект с тестами миграций и интеграционными тестами API на `WebApplicationFactory`.

## 4. Проекты и ответственность

### 4.1. Kanbex.Web — основное приложение

**Назначение:** MVC-страницы, Web API, аутентификация/авторизация, композиция зависимостей и интеграция React с Razor.

- MVC-контроллеры возвращают Razor-страницы-хосты.
- API-контроллеры принимают и проверяют DTO, вызывают серверную логику и возвращают HTTP-ответы. Контроллеры не содержат SQL и сложных доменных правил.
- ASP.NET Core Identity регистрирует пользователей, создаёт/завершает сессии и предоставляет текущего пользователя.
- `[Authorize]` и проверка владельца защищают личные доски и каждую операцию API.
- React-клиент получает и изменяет данные только через API.
- `Program.cs` конфигурирует MVC, API, Identity, EF Core SQLite, middleware и ViteDotNet.

Основные страницы и клиентские компоненты каркаса:

- `HomeController` / `Home/Index.cshtml` и `Home/Error.cshtml` — MVC-хост и страница ошибки.
- `HomeController.BoardSpa` — Razor-хост React для `/board` и `/boards`, включая вложенные клиентские маршруты.
- `LoginPage`, `RegisterPage`, `BoardsPage`, `BoardPage`, `AccountPage`, `NotFoundPage` — клиентские страницы.
- `App`, `AppRouter`, `AppLayout`, `RequireAuth` — корень SPA, маршруты, общая оболочка и клиентский guard.
- `LoginForm`, `RegisterForm`, `AuthProvider` — формы входа/регистрации и состояние серверной cookie-сессии.
- `ProjectCard`, `ProjectCreateDialog`, `KanbanBoard`, `BoardColumn`, `TaskCard`, `LearningTips` — компоненты доменной области.
- `services/authApi.ts` и `services/boardsApi.ts` — типизированные HTTP-клиенты `/api/auth/*` и `/api/boards/*` с same-origin cookie, antiforgery и разбором `ProblemDetails`.
- `features/boards/boardLogic.ts` и `pluralize.ts` — чистые функции WIP-проверок, перемещения и подписей; покрыты тестами. `useProjects` загружает список и выполняет создание/удаление через API, `useBoard` загружает доску и сохраняет её полной заменой.
- `features/auth/AuthProvider.tsx` загружает текущего пользователя через `GET /api/auth/me`, хранит `initializing`/`pending` и вызывает `/api/auth/*` для входа, регистрации и выхода.

`HomeController` также обслуживает прямые переходы на клиентские маршруты `/login`, `/register`, `/account`, `/boards/*` и `/board/*`, чтобы `BrowserRouter` не получал 404 от сервера. Для остальных URL без расширения работает fallback на Razor-хост SPA, поэтому прямой заход на неизвестный адрес показывает клиентскую `NotFoundPage`; `/api/*` при этом по-прежнему возвращает `404`.

### 4.2. Kanbex.Infrastructure — EF Core и Identity persistence

**Назначение:** EF Core DbContext, конфигурация сущностей, SQLite и миграции.

- `KanbexDbContext` наследуется от `IdentityDbContext<ApplicationUser>` и содержит доменные `DbSet`; стандартные таблицы Identity, включая claims, logins и tokens, сохранены.
- `ApplicationUser` расширяет Identity-пользователя полями `DisplayName`, `AvatarUrl` и `CreatedAt`. Глобальные роли: `Admin` и `User`.
- Конфигурации сущностей задаются Fluent API в `Persistence/Configurations/`.
- EF Core Code First migrations создают и обновляют схему SQLite; изменения схемы в обход миграций запрещены.
- Connection string задаётся конфигурацией `Kanbex.Web`. Локальный файл базы не включается в исходный контроль версий, если не является специально подготовленным демо-артефактом.
- Модель покрывает проекты (по одной Kanban-доске на проект), участников, колонки, задачи, историю, комментарии, теги и связи задач с тегами. Приоритет задачи, событие истории и роль участника проекта представлены C#-перечислениями и хранятся строками.
- Ограничения БД включают уникальность участия пользователя в проекте, уникальность имени тега в проекте, согласованность проекта у задачи и её колонки, а также проверки WIP-лимита, оценок и позиций. `Project.Version` служит токеном конкурентного изменения.
- `KanbexDbContextFactory` позволяет запускать `dotnet ef` непосредственно с инфраструктурным проектом. Например: `dotnet ef migrations add <ИмяМиграции> --project src/Kanbex.Infrastructure --startup-project src/Kanbex.Infrastructure --output-dir Persistence/Migrations`, затем `dotnet ef database update` с теми же параметрами. Design-time factory использует локальную строку `Data Source=kanbex.db`; приложение позднее должно передавать рабочую строку подключения из конфигурации `Kanbex.Web`.
- В локальной разработке миграции применяются через `dotnet ef database update`. Автоматическое применение при старте допустимо для учебной среды; для развёртывания предпочтительны контролируемые миграции.
- `Kanbex.Web` читает строку подключения из `ConnectionStrings:Kanbex` (`Data Source=kanbex.db` по умолчанию) и в Development сам применяет миграции при старте, затем идемпотентно создаёт роли `Admin`/`User` и демонстрационную учётную запись `student@kanbex.local` (флаг `SeedDemoUser`). В production миграции и сиды не запускаются автоматически.
- Identity настраивается через `AddIdentity<ApplicationUser, IdentityRole>` с EF Core-хранилищем и same-origin cookie `Kanbex.Auth`. Для путей `/api/*` неаутентифицированный запрос получает `401`, а недостаток прав — `403`, без HTML-редиректа на страницу входа. Для изменяющих состояние запросов регистрируется antiforgery с заголовком `X-CSRF-TOKEN`.

### 4.3. Kanbex.UI — библиотека общих React-компонентов

**Назначение:** повторно используемые и доступные визуальные компоненты без доменной логики, API, Identity и зависимости от роутера.

- `AppButton` — единая кнопка, использующая подходящие варианты `m3-expressive-react`.
- `AppDialog` — диалог подтверждения или простой информационный диалог.
- `AppHeader` — общая верхняя панель.
- `EmptyState` — пустое состояние с объяснением и действием.
- `KanbexLogo` — встроенный SVG-логотип с фирменной палитрой.
- `LoadingState` — индикация ожидания.
- `StatusBadge` — метка приоритета/статуса.

Публичный API экспортируется из `src/index.ts`. Компоненты получают данные через props и вызывают callbacks. Библиотека не выполняет fetch, не обращается к Identity/хранилищу и не содержит правил Kanban. `BoardColumn` и `TaskCard` остаются в feature-коде основного приложения.

Фирменная палитра логотипа объявлена в `styles/components.css` как `--kb-color-violet`, `--kb-color-violet-soft`, `--kb-color-red`, `--kb-color-red-soft`, `--kb-color-green`, `--kb-color-green-soft` (плюс белый фон). `KanbexLogo` использует те же HEX-значения; `ThemeProvider` в `App.tsx` получает seed-цвет `#7979FF`, поэтому Material-токены и бренд согласованы. Цвета применяются в шапке, акцентах колонок и метках статусов.

Для каждого компонента библиотеки есть unit-тест в формате `*.test.tsx`. Тесты запускаются в `jsdom` через Jest (`jest-environment-jsdom`); `m3-expressive-react` в тестовом окружении заменяется лёгким mock, чтобы проверять контракт `@kanbex/ui`, а не реализацию сторонней библиотеки. Порог покрытия — не ниже 70% по statements, branches, functions и lines; фактическое покрытие всех компонентов выше порога.

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
| `POST /api/boards` | Аутентифицированный | Создать личную доску с тремя начальными колонками и демонстрационными карточками. |
| `GET /api/boards/{boardId}` | Аутентифицированный + владелец | Получить доску, колонки и карточки. |
| `PUT /api/boards/{boardId}` | Аутентифицированный + владелец | Сохранить изменения; сервер проверяет WIP-правила. |
| `POST /api/boards/{boardId}/reset` | Аутентифицированный + владелец | Сбросить доску к начальному учебному содержимому. |
| `DELETE /api/boards/{boardId}` | Аутентифицированный + владелец | Удалить доску, если это действие включено в согласованный MVP. |

Для cookie-аутентификации React и API работают на одном origin. Изменяющие состояние запросы защищаются от CSRF, например antiforgery-токеном и настройкой cookie. CORS не включается без необходимости. API не возвращает хэши паролей или другие секреты Identity.

### 5.1. Контракт API

Контракт ниже является действующим для API аутентификации и досок. Маршруты `/api/auth/*` и CRUD `/api/boards/*` реализованы и покрыты интеграционными тестами. JSON использует `camelCase`, enum-приоритеты — строки `low`, `medium`, `high`, `critical`, идентификаторы досок и колонок — GUID. Ошибки возвращаются в формате `ProblemDetails` с необязательным расширением `errors` для ошибок полей.

| Метод и маршрут | Запрос | Успешный ответ | Основные ошибки |
|---|---|---|---|
| `GET /api/auth/antiforgery-token` | — | `200 { requestToken }`; также устанавливается antiforgery-cookie | — |
| `POST /api/auth/register` | `{ displayName, email, password }` | `201 CurrentUser`; установить cookie-сессию | `400` ошибки полей, `409` email занят |
| `POST /api/auth/login` | `{ email, password }` | `200 CurrentUser`; установить cookie-сессию | `400` неверный формат, `401` неверные учётные данные |
| `POST /api/auth/logout` | antiforgery-заголовок | `204`; удалить cookie-сессию | `401` нет сессии, `400` неверный antiforgery-токен |
| `GET /api/auth/me` | — | `200 CurrentUser` | `401` нет сессии |
| `GET /api/boards` | — | `200 BoardSummary[]` | `401` нет сессии |
| `POST /api/boards` | `{ title, description }` | `201 Board`; `Location: /api/boards/{id}` | `400` ошибки полей, `401` нет сессии |
| `GET /api/boards/{boardId}` | — | `200 Board` | `401` нет сессии, `404` не найдена или недоступна |
| `PUT /api/boards/{boardId}` | `{ title, description, version, columns }` | `200 Board`; новая версия включена в ответ | `400` ошибки полей, `401` нет сессии, `404` не найдена или недоступна, `409` WIP/конфликт версии |
| `POST /api/boards/{boardId}/reset` | antiforgery-заголовок | `200 Board`; начальные колонки, карточки и новая версия | `401` нет сессии, `404` не найдена или недоступна |
| `DELETE /api/boards/{boardId}` | antiforgery-заголовок | `204` | `401` нет сессии, `404` не найдена или недоступна |

`CurrentUser` соответствует `src/types/index.ts`: `{ id, displayName, email }`. `BoardSummary` содержит `{ id, title, description, taskCount, columnCount }`. `Board` содержит `{ id, title, description, version, columns }`; колонка — `{ id, title, wipLimit, order, tasks }`, карточка — `{ id, title, description, priority, order }`. Доска создаётся с тремя начальными колонками и демонстрационными карточками; список упорядочен по `UpdatedAt DESC`. В `PUT` сервер принимает целое `version` из `Project.Version`; при несовпадении версии или превышении WIP возвращает `409 ProblemDetails`. `PUT` является полной заменой списка колонок и карточек доски в одной транзакции: колонки и карточки можно добавлять, переименовывать, переставлять и удалять. Идентификаторы сохраняемых сущностей сохраняют связи и комментарии; история сохраняется, кроме записей, ссылающихся на удаляемую колонку. Порядок колонок и задач должен быть непрерывным с нуля. `POST /api/boards/{boardId}/reset` заменяет колонки и карточки начальным учебным набором, удаляет пользовательские карточки вместе с комментариями и увеличивает версию. Владелец доски определяется только из аутентифицированной сессии; доступ участников пока не включён. Чужие и отсутствующие доски возвращают одинаковый `404`. `401` и `403` для `/api/*` возвращаются статусами без HTML-редиректа.

Все изменяющие запросы под `/api/*` проверяются общим `ApiAntiforgeryFilter`. Клиент получает request token и передаёт его в `X-CSRF-TOKEN`; cookie-аутентификация остаётся same-origin. Для анонимных `register` и `login` также обязателен antiforgery-токен. Токен привязан к текущей identity, поэтому после входа или регистрации клиент получает новый токен. DTO и коды ответов покрыты интеграционными тестами `src/Kanbex.Tests/AuthApiTests.cs` и `BoardApiTests.cs`.

## 6. Интеграция React, Razor и Vite

- `Kanbex.Web/Program.cs` регистрирует MVC, API и `AddViteIntegration(builder.Configuration)`.
- `Views/_ViewImports.cshtml` подключает MVC tag helpers и `@addTagHelper *, ViteDotNet`.
- `appsettings.json` задаёт имя SPA-папки: `"ViteDotNet": "ReactApp"`.
- `ReactApp/vite.config.ts` использует React-плагин и `ViteDotNetPlugin('src/main.tsx', 'root')`.
- Razor-представление содержит единственный `<div id="root"></div>` и выбирает `<dev-vite-scripts>` в Development или `<prod-vite-scripts>` в Production.
- В Development React-модули обслуживает Vite dev server с HMR. В Production Vite формирует бандлы и манифесты в `wwwroot/ReactApp`; ASP.NET Core отдаёт их как статические файлы.
- React управляет DOM внутри `#root`; MVC/Razor остаётся серверным хостом страницы.

## 7. Библиотеки и версии

Текущие версии зафиксированы в `package-lock.json` и `.csproj`. Не использовать плавающий `latest`; при обновлении проверять совместимость и повторно прогонять `lint`, `test`, `test:coverage` и `build`.

| Библиотека / платформа | Версия | Проект | Назначение |
|---|---:|---|---|
| .NET / ASP.NET Core | 10.0 | `Kanbex.Web` | MVC, Razor, Web API, Identity и серверная часть. |
| Entity Framework Core | 10.0.9 | `Kanbex.Infrastructure` | ORM, SQLite provider, Code First и миграции. Версии пакетов EF Core должны совпадать по major/minor. |
| ASP.NET Core Identity | 10.0.x | `Kanbex.Web`, `Kanbex.Infrastructure` | Пользователи, проверка паролей, cookie-сессии и авторизация. |
| SQLite | версия провайдера `Microsoft.EntityFrameworkCore.Sqlite` 10.0.9 | `Kanbex.Infrastructure` | Простая локальная реляционная БД; версией SQLite управляет совместимый EF Core provider. |
| `TechGems.ViteDotNet` | 1.0.0 | `Kanbex.Web` | Tag Helpers и интеграция Vite с Razor. |
| Node.js | 24.20.0 | frontend | Запуск npm и инструментов сборки. |
| React / React DOM | 19.3.1 | `ReactApp`, `Kanbex.UI` | Компонентный UI и монтирование в DOM. |
| TypeScript | 5.9.3 | frontend | Типизация клиентского кода и совместимость с typescript-eslint. |
| Vite | 8.3.8 | `ReactApp` | Dev server, HMR и production-сборка. |
| `@vitejs/plugin-react` | 6.3.0 | `ReactApp` | Поддержка React и JSX в Vite. |
| `vite-dotnet` | 1.0.0 | `ReactApp` | Vite-плагин манифестов и публикации сборки; версия согласуется с NuGet-пакетом. |
| `m3-expressive-react` | 1.8.2 | `Kanbex.UI` / `ReactApp` | Компоненты Material 3 Expressive и ThemeProvider; корневой entrypoint импортирует `styles.css`. |
| `react-router` | 7.18.5 | `ReactApp` | Клиентская маршрутизация и защищённые представления UX-уровня. |
| `@dnd-kit/core` | 6.3.1 | `ReactApp` | Drag-and-drop карточек. |
| `@dnd-kit/sortable` | 10.0.0 | `ReactApp` | Сортировка карточек и совместимость с `@dnd-kit/core`. |
| `@testing-library/react` | 16.3.3 | `Kanbex.UI` | Тестирование поведения React-компонентов. |
| `@testing-library/jest-dom` | 7.0.1 | `Kanbex.UI` | DOM-матчеры в unit-тестах. |
| Jest | 30.5.2 | `ReactApp`, `Kanbex.UI` | Клиентские модульные тесты и coverage. |
| `jest-environment-jsdom` | 30.5.2 | `Kanbex.UI` | DOM-окружение Jest для тестов компонентов. |
| `babel-jest` | 30.5.2 | `ReactApp`, `Kanbex.UI` | Трансформация TS/JSX в тестах. |
| `@babel/core` | 7.29.13 | корень, frontend | Ядро Babel для `babel-jest`. |
| `@babel/preset-env` | 7.29.14 | `ReactApp`, `Kanbex.UI` | Перевод ESM/TS в CommonJS для Jest. |
| `@babel/preset-react` | 7.29.7 | `ReactApp`, `Kanbex.UI` | JSX с автоматическим runtime. |
| `@babel/preset-typescript` | 7.29.7 | `ReactApp`, `Kanbex.UI` | Удаление TypeScript-синтаксиса в тестах. |
| `jsdom` | 31.0.1 | `Kanbex.UI` | DOM-окружение (зависимость `jest-environment-jsdom`). |
| ESLint | 9.39.5 | `ReactApp`, `Kanbex.UI` | Проверка стиля и типизированных правил. |
| `@eslint/js` | 9.39.5 | `ReactApp`, `Kanbex.UI` | Базовые правила ESLint. |
| `typescript-eslint` | 8.73.0 | `ReactApp`, `Kanbex.UI` | TypeScript-парсер и правила ESLint. |
| `globals` | 17.14.0 | `ReactApp`, `Kanbex.UI` | Наборы глобальных переменных для ESLint. |
| xUnit | актуальная стабильная версия на момент реализации | `src/Kanbex.Tests` | Unit- и интеграционные тесты .NET-проектов. |
| `Microsoft.AspNetCore.Mvc.Testing` | 10.0.x | `Kanbex.Tests` | Интеграционное тестирование MVC/API с тестовым хостом. |

`Kanbex.UI` использует React и `m3-expressive-react` как peer/workspace-зависимости, чтобы не включать дубли React. Конфигурация peer dependencies зафиксирована в `src/Kanbex.UI/package.json`.

## 8. Роутинг и авторизация

### 8.1. MVC-маршруты

| URL | MVC-действие | Назначение | Доступ |
|---|---|---|---|
| `/` | `HomeController.Index` | Вводная страница и переход к симулятору. | Открытый |
| `/boards` | `HomeController.BoardSpa` | Razor-хост React для списка проектов. | Клиентский guard; в MVP — аутентифицированный. |
| `/board` | `HomeController.BoardSpa` | Алиас Razor-хоста для обратной совместимости. | Клиентский guard; в MVP — аутентифицированный. |
| `/boards/{boardId:guid}` | `HomeController.BoardSpa` | Хост доски; идентификатор передаётся React и API. | Клиентский guard; владелец проверяется сервером в MVP. |
| `/board/{boardId:guid}` | `HomeController.BoardSpa` | Алиас хоста доски. | Клиентский guard; владелец проверяется сервером в MVP. |
| `/boards/{**rest}` | `HomeController.BoardSpa` | Прямое открытие вложенного клиентского URL без 404. | Открытый хост; данные защищает API. |
| `/board/{**rest}` | `HomeController.BoardSpa` | Прямое открытие вложенного клиентского URL без 404. | Открытый хост; данные защищает API. |
| любой URL без расширения | `HomeController.SpaFallback` | Хост SPA для неизвестного клиентского адреса; `/api/*` получает `404`. | Открытый хост. |
| `/login` | `HomeController.Spa` | Хост страницы входа React. | Открытый |
| `/register` | `HomeController.Spa` | Хост страницы регистрации React. | Открытый |
| `/account` | `HomeController.Spa` | Хост профиля пользователя. | Клиентский guard; в MVP — `[Authorize]`. |
| `/Identity/Account/Login` | `HomeController.IdentityLogin` | Совместимый редирект на `/login`. | Открытый |
| `/Identity/Account/Register` | `HomeController.IdentityRegister` | Совместимый редирект на `/register`. | Открытый |
| `/Identity/Account/Logout` | `HomeController.IdentityLogout` | Совместимый редирект на `/login`. | Открытый; в MVP — POST с CSRF. |

### 8.2. API-маршруты

API-маршруты перечислены в разделе 5 и имеют префикс `/api`. Доступ контролируется на сервере с помощью Identity, `[Authorize]` и проверки владельца ресурса.

### 8.3. React Router и параметры

Внутри React-приложения `BrowserRouter` отображает страницы входа/регистрации, список проектов, доску, профиль и страницу 404. Дерево маршрутов:

```text
/                         -> redirect на /boards
/login                    -> LoginPage (открытый)
/register                 -> RegisterPage (открытый)
RequireAuth + AppLayout
  /boards                 -> BoardsPage
  /boards/:boardId        -> BoardPage
  /board                  -> BoardsPage (алиас)
  /board/:boardId         -> BoardPage (алиас)
  /account                -> AccountPage
*                         -> NotFoundPage
```

`RequireAuth` перенаправляет неаутентифицированного пользователя на `/login` и сохраняет исходный путь в `state.from`. `boardId` проверяется по формату GUID на клиенте; авторитетный ответ о существовании и доступе возвращает Web API. Клиентский guard нужен для навигации, но не заменяет серверную авторизацию. `AuthProvider` при старте вызывает `GET /api/auth/me`; пока ответ не получен, `RequireAuth` показывает состояние загрузки и не выполняет редирект.

При прямом открытии URL ASP.NET Core возвращает Razor-хост для клиентского маршрута. Все операции чтения/записи независимо защищены API.

## 9. Как приложение использует Kanbex.UI

`ReactApp` подключает `@kanbex/ui` как локальную workspace-зависимость и импортирует общие компоненты из публичного API:

```tsx
import { AppButton, AppDialog, EmptyState, StatusBadge } from '@kanbex/ui'
```

Библиотека отвечает только за переиспользуемое представление и доступность. Приложение передаёт props и callbacks. Доменные правила, маршрутизация, API-вызовы и состояние досок остаются в `Kanbex.Web/ReactApp`; библиотека не знает о текущем пользователе, Identity или структуре БД.

Фактические точки использования: `AppLayout`, `LoginPage` и `RegisterPage` импортируют `AppHeader`, `AppButton` и `KanbexLogo`; `BoardsPage` — `AppButton`, `AppDialog`, `EmptyState`; `BoardPage` — `AppButton`, `AppDialog`, `EmptyState`, `LoadingState`, `StatusBadge`; `KanbanBoard` и `LearningTips` — `StatusBadge`/`AppButton`. Таким образом библиотека реально участвует в рендере основного приложения, а не только объявлена зависимостью.

## 10. Качество кода, lint и тесты

Оба frontend-пакета имеют `"type": "module"` и используют ES-импорты/экспорты. Исходный код приложений и библиотеки не использует `require` и `module.exports`; CommonJS допускается только в конфигурационных файлах `jest.config.cjs` и `babel.config.cjs`, которые загружает тестовый раннер.

| Команда | `Kanbex.Web/ReactApp` | `Kanbex.UI` |
|---|---|---|
| `npm run dev` | Vite dev server | `tsc --noEmit --watch` |
| `npm run build` | `tsc -b && vite build` | `tsc --noEmit` |
| `npm run lint` | `eslint .` | `eslint .` |
| `npm run lint:fix` | `eslint . --fix` | `eslint . --fix` |
| `npm test` | `jest` | `jest` |
| `npm run test:coverage` | `jest --coverage` | `jest --coverage` |

ESLint настроен на 2 пробела, запрет `;` в конце выражений, отсутствие лишних пустых строк, запрет `any` и предупреждений. Команда `npm run lint` должна завершаться без вывода ошибок и предупреждений. Coverage библиотеки компонентов настраивается в `Kanbex.UI/jest.config.cjs`: порог 70% по statements, branches, functions и lines для файлов `src/components/**/*.tsx`. Тесты компонентов выполняются в `jsdom`, тесты чистой логики доски — в `node`.

В корне репозитория `README.md` содержит описание проекта, логотип, палитру, инструкцию запуска и скриншоты из `docs/screenshots/`. Сгенерированные каталоги `node_modules`, `coverage`, `dist`, `wwwroot/ReactApp`, а также локальные БД и артефакты сборки исключены через `.gitignore`.
