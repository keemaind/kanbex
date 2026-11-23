using Kanbex.Infrastructure.Domain.Entities;
using Kanbex.Infrastructure.Domain.Enums;
using Kanbex.Infrastructure.Persistence;
using Kanbex.Web.Contracts;
using Microsoft.EntityFrameworkCore;

namespace Kanbex.Web.Services;

/// <summary>
/// Результат операции с доской: разделяет «не найдено» (нет доски или нет
/// доступа), «запрещено» (участник без прав Creator) и «конфликт» версии/WIP.
/// </summary>
public sealed record AccessResult<T>(T? Value, bool IsNotFound, bool IsForbidden, bool IsConflict = false)
{
    public static AccessResult<T> NotFound => new(default, true, false);
    public static AccessResult<T> Forbidden => new(default, false, true);
    public static AccessResult<T> Conflict => new(default, false, false, true);
    public static AccessResult<T> Ok(T value) => new(value, false, false);
}

public sealed class BoardService(
    KanbexDbContext dbContext,
    ProjectAccessService accessService,
    TaskHistoryService historyService)
{
    private const int TemporaryColumnOrder = 1_000_000;
    private const int TemporaryNewColumnOrder = 2_000_000;

    private static readonly (string Name, int? WipLimit, (string Title, string Description, TaskPriority Priority)[] Tasks)[] InitialBoard =
    [
        ("К выполнению", null,
        [
            ("Разобраться, зачем визуализировать поток", "Прочитайте вводную подсказку и сформулируйте, где в вашей работе теряется время.", TaskPriority.Medium),
            ("Собрать требования к доске", "Короткий список того, что должна показывать доска: этапы, карточки, WIP-лимит.", TaskPriority.Low),
            ("Определить критерии готовности", "Договоритесь, что считается завершённой работой, прежде чем двигать карточку в «Готово».", TaskPriority.Low),
        ]),
        ("В работе", 2,
        [
            ("Настроить WIP-лимит колонки", "Ограничьте число одновременных задач и проверьте, как интерфейс объясняет отказ.", TaskPriority.High),
            ("Провести первый обзор доски", "Пройдитесь по колонкам слева направо и отметьте «застрявшие» карточки.", TaskPriority.Medium),
        ]),
        ("Готово", null,
        [
            ("Создать учебную доску", "Базовая доска с тремя этапами создана и сохранена.", TaskPriority.Low),
        ]),
    ];

    private sealed record BoardTemplate(
        string Title,
        string Description,
        (string Name, int? WipLimit, (string Title, string Description, TaskPriority Priority)[] Tasks)[] Columns);

    /// <summary>
    /// Готовые сценарии использования: каждая аудитория получает доску
    /// с предустановленными колонками и карточками (seed data).
    /// </summary>
    private static readonly Dictionary<string, BoardTemplate> Templates = new(StringComparer.OrdinalIgnoreCase)
    {
        ["student"] = new(
            "Учебная доска",
            "Шаблон для студента: дисциплины, дедлайны и подготовка к экзаменам под контролем.",
            [
                ("К выполнению", null,
                [
                    ("Составить план на семестр", "Разложите дисциплины по неделям и отметьте дедлайны.", TaskPriority.Medium),
                    ("Найти материалы к коллоквиуму", "Соберите конспекты, лекции и список вопросов.", TaskPriority.Low),
                    ("Выбрать тему курсовой", "Запишите 3–5 тем и обсудите их с научным руководителем.", TaskPriority.Medium),
                ]),
                ("В работе", 2,
                [
                    ("Подготовиться к лабораторной №1", "Повторите теорию и набросайте ход работы.", TaskPriority.High),
                    ("Написать конспект к семинару", "Кратко зафиксируйте главные тезисы.", TaskPriority.Medium),
                ]),
                ("Готово", null,
                [
                    ("Записаться на курс", "Дисциплина выбрана и добавлена в учебный план.", TaskPriority.Low),
                ]),
            ]),
        ["developer"] = new(
            "Пет-проект",
            "Шаблон для разработчика: от идеи в бэклоге до код-ревью и релиза.",
            [
                ("Backlog", null,
                [
                    ("Завести репозиторий и CI", "Настройте сборку и автотесты на каждый push.", TaskPriority.High),
                    ("Спроектировать схему БД", "Опишите сущности и связи до первой миграции.", TaskPriority.Medium),
                    ("Собрать референсы интерфейса", "Подберите 3–5 примеров, как должен выглядеть экран.", TaskPriority.Low),
                ]),
                ("В работе", 2,
                [
                    ("Сверстать главный экран", "Соберите каркас интерфейса по выбранным референсам.", TaskPriority.High),
                    ("Подключить API", "Настройте клиент и обработку ошибок.", TaskPriority.Medium),
                ]),
                ("Код-ревью", null,
                [
                    ("Покрыть сервисы тестами", "Проверьте, что ключевая логика покрыта unit-тестами.", TaskPriority.Medium),
                ]),
                ("Готово", null,
                [
                    ("Придумать идею проекта", "Идея зафиксирована в README.", TaskPriority.Low),
                ]),
            ]),
        ["manager"] = new(
            "Задачи команды",
            "Шаблон для менеджера: планирование, синхронизация и статус по целям.",
            [
                ("Задачи", null,
                [
                    ("Провести планирование спринта", "Соберите команду и зафиксируйте цели спринта.", TaskPriority.High),
                    ("Обновить дорожную карту", "Сверьте сроки и приоритеты проектов.", TaskPriority.Medium),
                    ("Собрать обратную связь", "Спросите команду, что мешает работе.", TaskPriority.Low),
                ]),
                ("В работе", 3,
                [
                    ("Подготовить статус-отчёт", "Соберите метрики и прогресс по целям.", TaskPriority.Medium),
                    ("Синхронизировать зависимые задачи", "Проверьте, что блокеры разрешены.", TaskPriority.High),
                ]),
                ("На проверке", null,
                [
                    ("Проверить результаты релиза", "Убедитесь, что релиз соответствует плану.", TaskPriority.Medium),
                ]),
                ("Готово", null,
                [
                    ("Провести ретроспективу", "Команда обсудила итоги спринта.", TaskPriority.Low),
                ]),
            ]),
        ["personal"] = new(
            "Личные дела",
            "Шаблон для личных задач: список дел на неделю без перегруза.",
            [
                ("Сделать", null,
                [
                    ("Составить список дел на неделю", "Выпишите всё, что требует внимания.", TaskPriority.Medium),
                    ("Запланировать поездку на выходные", "Маршрут, билеты и бюджет.", TaskPriority.Low),
                    ("Навести порядок в закладках", "Разложите сохранённые статьи по папкам.", TaskPriority.Low),
                ]),
                ("В процессе", 2,
                [
                    ("Разобрать входящие", "Почта, заметки и документы.", TaskPriority.Low),
                ]),
                ("Готово", null,
                [
                    ("Составить список покупок", "Список готов и всегда под рукой.", TaskPriority.Low),
                ]),
            ]),
    };

    public async Task<IReadOnlyList<BoardSummaryResponse>> ListAsync(string userId, CancellationToken cancellationToken)
    {
        var projects = await dbContext.Projects
            .AsNoTracking()
            .Where(project => project.OwnerId == userId || project.Members.Any(member => member.UserId == userId))
            .Include(project => project.Columns)
            .ThenInclude(column => column.Tasks)
            .OrderByDescending(project => project.UpdatedAt)
            .ToListAsync(cancellationToken);

        return projects.Select(project =>
        {
            // Последняя колонка считается этапом «Готово»: её карточки дают прогресс.
            var lastColumn = project.Columns.OrderByDescending(column => column.SortOrder).FirstOrDefault();

            return new BoardSummaryResponse(
                project.Id,
                project.Name,
                project.Description ?? string.Empty,
                project.Columns.Sum(column => column.Tasks.Count),
                project.Columns.Count,
                project.UpdatedAt,
                lastColumn?.Tasks.Count ?? 0,
                project.OwnerId == userId ? ProjectMemberRole.Creator : ProjectMemberRole.Member,
                project.IsPublic);
        }).ToList();
    }

    public async Task<AccessResult<BoardResponse>> GetAsync(
        Guid boardId,
        string userId,
        CancellationToken cancellationToken)
    {
        var project = await LoadProjectAsync(boardId, cancellationToken);
        if (project is null)
        {
            return AccessResult<BoardResponse>.NotFound;
        }

        var role = ResolveRole(project, userId);
        return role is null
            ? AccessResult<BoardResponse>.NotFound
            : AccessResult<BoardResponse>.Ok(ToResponse(project, role.Value));
    }

    public async Task<BoardResponse> CreateAsync(CreateBoardRequest request, string ownerId, CancellationToken cancellationToken)
    {
        if (request.Title.Trim().Length < 2)
        {
            throw new BoardValidationException("Название доски должно содержать не менее двух символов.");
        }

        var now = DateTime.UtcNow;
        var project = new Project
        {
            Name = request.Title.Trim(),
            Description = NormalizeDescription(request.Description),
            OwnerId = ownerId,
            CreatedAt = now,
            UpdatedAt = now,
            Version = 0,
        };

        project.Columns = CreateColumns(project.Id, ownerId, now, InitialBoard);

        dbContext.Projects.Add(project);
        await dbContext.SaveChangesAsync(cancellationToken);
        return ToResponse(project, ProjectMemberRole.Creator);
    }

    /// <summary>
    /// Создаёт доску по готовому шаблону: предустановленные колонки и
    /// карточки для конкретного сценария использования.
    /// </summary>
    public async Task<BoardResponse?> CreateFromTemplateAsync(
        string templateKey,
        string ownerId,
        CancellationToken cancellationToken)
    {
        if (!Templates.TryGetValue(templateKey, out var template))
        {
            return null;
        }

        var now = DateTime.UtcNow;
        var project = new Project
        {
            Name = template.Title,
            Description = NormalizeDescription(template.Description),
            OwnerId = ownerId,
            CreatedAt = now,
            UpdatedAt = now,
            Version = 0,
        };

        project.Columns = CreateColumns(project.Id, ownerId, now, template.Columns);

        dbContext.Projects.Add(project);
        await dbContext.SaveChangesAsync(cancellationToken);
        return ToResponse(project, ProjectMemberRole.Creator);
    }

    public async Task<AccessResult<BoardResponse>> ResetAsync(
        Guid boardId,
        string userId,
        CancellationToken cancellationToken)
    {
        var role = await accessService.GetRoleAsync(boardId, userId, cancellationToken);
        if (role is null)
        {
            return AccessResult<BoardResponse>.NotFound;
        }

        if (role != ProjectMemberRole.Creator)
        {
            return AccessResult<BoardResponse>.Forbidden;
        }

        var now = DateTime.UtcNow;
        await using var transaction = await dbContext.Database.BeginTransactionAsync(cancellationToken);

        await dbContext.TaskHistory
            .Where(history => history.ProjectId == boardId)
            .ExecuteDeleteAsync(cancellationToken);

        await dbContext.KanbanTasks
            .Where(task => task.ProjectId == boardId)
            .ExecuteDeleteAsync(cancellationToken);

        await dbContext.Columns
            .Where(column => column.ProjectId == boardId)
            .ExecuteDeleteAsync(cancellationToken);

        var updatedRows = await dbContext.Projects
            .Where(candidate => candidate.Id == boardId)
            .ExecuteUpdateAsync(updates => updates
                .SetProperty(candidate => candidate.UpdatedAt, now)
                .SetProperty(candidate => candidate.Version, candidate => candidate.Version + 1), cancellationToken);

        if (updatedRows == 0)
        {
            await transaction.RollbackAsync(cancellationToken);
            return AccessResult<BoardResponse>.NotFound;
        }

        dbContext.Columns.AddRange(CreateColumns(boardId, userId, now, InitialBoard));
        await dbContext.SaveChangesAsync(cancellationToken);
        dbContext.ChangeTracker.Clear();

        await transaction.CommitAsync(cancellationToken);

        return await GetAsync(boardId, userId, cancellationToken);
    }

    public async Task<AccessResult<BoardResponse>> UpdateAsync(
        Guid boardId,
        string userId,
        UpdateBoardRequest request,
        CancellationToken cancellationToken)
    {
        var project = await dbContext.Projects
            .AsNoTracking()
            .SingleOrDefaultAsync(candidate => candidate.Id == boardId, cancellationToken);

        if (project is null)
        {
            return AccessResult<BoardResponse>.NotFound;
        }

        var role = await accessService.GetRoleAsync(boardId, userId, cancellationToken);
        if (role is null)
        {
            return AccessResult<BoardResponse>.NotFound;
        }

        if (project.Version != request.Version)
        {
            return AccessResult<BoardResponse>.Conflict;
        }

        if (role != ProjectMemberRole.Creator &&
            (request.Title.Trim() != project.Name ||
             NormalizeDescription(request.Description) != project.Description))
        {
            return AccessResult<BoardResponse>.Forbidden;
        }

        if (request.Columns.Any(column => column.WipLimit is int limit && column.Tasks.Count > limit))
        {
            return AccessResult<BoardResponse>.Conflict;
        }

        var validationError = ValidateUpdate(request);
        if (validationError is not null)
        {
            throw new BoardValidationException(validationError);
        }

        var validAssigneeIds = await GetParticipantIdsAsync(boardId, cancellationToken);
        if (request.Columns
            .SelectMany(column => column.Tasks)
            .Any(task => task.AssigneeId is not null && !validAssigneeIds.Contains(task.AssigneeId)))
        {
            throw new BoardValidationException("Исполнителем может быть только Creator или Member доски.");
        }

        var requestedColumnIds = request.Columns.Select(column => column.Id).ToArray();
        var requestedTasks = request.Columns.SelectMany(column => column.Tasks).ToList();
        var requestedTaskIds = requestedTasks.Select(task => task.Id).ToArray();

        var before = await dbContext.KanbanTasks
            .AsNoTracking()
            .Where(task => task.ProjectId == boardId)
            .Select(task => new TaskState(
                task.Id,
                task.ColumnId,
                task.Title,
                task.Description,
                task.Priority,
                task.AssigneeId,
                task.DueDate,
                task.Estimate))
            .ToListAsync(cancellationToken);
        var beforeById = before.ToDictionary(task => task.Id);

        // Snapshot the current board without tracking: ColumnId participates in
        // alternate keys, so EF forbids changing it on a tracked KanbanTask.
        // All writes below go through ExecuteUpdate/ExecuteDelete instead.
        var currentColumnIds = await dbContext.Columns
            .AsNoTracking()
            .Where(column => column.ProjectId == boardId)
            .Select(column => column.Id)
            .ToListAsync(cancellationToken);
        var currentTaskIds = await dbContext.KanbanTasks
            .AsNoTracking()
            .Where(task => task.ProjectId == boardId)
            .Select(task => task.Id)
            .ToListAsync(cancellationToken);

        var currentColumnIdSet = currentColumnIds.ToHashSet();
        var currentTaskIdSet = currentTaskIds.ToHashSet();
        var requestedColumnIdSet = requestedColumnIds.ToHashSet();
        var requestedTaskIdSet = requestedTaskIds.ToHashSet();

        var removedColumnIds = currentColumnIds.Where(id => !requestedColumnIdSet.Contains(id)).ToArray();
        var removedTaskIds = currentTaskIds.Where(id => !requestedTaskIdSet.Contains(id)).ToArray();
        var newColumns = request.Columns.Where(column => !currentColumnIdSet.Contains(column.Id)).ToList();

        var now = DateTime.UtcNow;
        await using var transaction = await dbContext.Database.BeginTransactionAsync(cancellationToken);

        int updatedRows;
        if (role == ProjectMemberRole.Creator)
        {
            updatedRows = await dbContext.Projects
                .Where(candidate => candidate.Id == boardId && candidate.Version == request.Version)
                .ExecuteUpdateAsync(updates => updates
                    .SetProperty(candidate => candidate.Name, request.Title.Trim())
                    .SetProperty(candidate => candidate.Description, NormalizeDescription(request.Description))
                    .SetProperty(candidate => candidate.UpdatedAt, now)
                    .SetProperty(candidate => candidate.Version, candidate => candidate.Version + 1), cancellationToken);
        }
        else
        {
            updatedRows = await dbContext.Projects
                .Where(candidate => candidate.Id == boardId && candidate.Version == request.Version)
                .ExecuteUpdateAsync(updates => updates
                    .SetProperty(candidate => candidate.UpdatedAt, now)
                    .SetProperty(candidate => candidate.Version, candidate => candidate.Version + 1), cancellationToken);
        }

        if (updatedRows == 0)
        {
            await transaction.RollbackAsync(cancellationToken);
            return AccessResult<BoardResponse>.Conflict;
        }

        var conflictingColumnIds = await dbContext.Columns
            .AsNoTracking()
            .Where(column => requestedColumnIds.Contains(column.Id) && column.ProjectId != boardId)
            .Select(column => column.Id)
            .ToListAsync(cancellationToken);
        var conflictingTaskIds = await dbContext.KanbanTasks
            .AsNoTracking()
            .Where(task => requestedTaskIds.Contains(task.Id) && task.ProjectId != boardId)
            .Select(task => task.Id)
            .ToListAsync(cancellationToken);
        if (conflictingColumnIds.Count > 0 || conflictingTaskIds.Count > 0)
        {
            throw new BoardValidationException("Идентификатор колонки или карточки уже используется другой доской.");
        }

        if (removedColumnIds.Length > 0)
        {
            // Historical rows may restrict deletion of columns; remove only entries
            // that refer to a column actually removed by this replacement.
            await dbContext.TaskHistory
                .Where(history =>
                    (history.OldColumnId.HasValue && removedColumnIds.Contains(history.OldColumnId.Value)) ||
                    (history.NewColumnId.HasValue && removedColumnIds.Contains(history.NewColumnId.Value)))
                .ExecuteDeleteAsync(cancellationToken);
        }

        if (removedTaskIds.Length > 0)
        {
            // Comments, tags and history of removed cards cascade at the database level.
            await dbContext.KanbanTasks
                .Where(task => task.ProjectId == boardId && removedTaskIds.Contains(task.Id))
                .ExecuteDeleteAsync(cancellationToken);
        }

        if (newColumns.Count > 0)
        {
            dbContext.Columns.AddRange(newColumns.Select((column, index) => new KanbanColumn
            {
                Id = column.Id,
                Name = column.Title.Trim(),
                SortOrder = TemporaryNewColumnOrder + index,
                WipLimit = column.WipLimit,
                ProjectId = boardId,
            }));
            await dbContext.SaveChangesAsync(cancellationToken);
            dbContext.ChangeTracker.Clear();
        }

        // Existing cards keep their Id, so comments and tags survive moves.
        foreach (var column in request.Columns)
        {
            foreach (var task in column.Tasks.Where(task => currentTaskIdSet.Contains(task.Id)))
            {
                var taskId = task.Id;
                var title = task.Title.Trim();
                var description = NormalizeDescription(task.Description);
                var priority = task.Priority;
                var position = task.Order;
                var columnId = column.Id;
                var assigneeId = task.AssigneeId;
                var dueDate = task.DueDate;
                var estimate = task.Estimate;

                await dbContext.KanbanTasks
                    .Where(candidate => candidate.Id == taskId && candidate.ProjectId == boardId)
                    .ExecuteUpdateAsync(updates => updates
                        .SetProperty(candidate => candidate.Title, title)
                        .SetProperty(candidate => candidate.Description, description)
                        .SetProperty(candidate => candidate.Priority, priority)
                        .SetProperty(candidate => candidate.Position, position)
                        .SetProperty(candidate => candidate.ColumnId, columnId)
                        .SetProperty(candidate => candidate.AssigneeId, assigneeId)
                        .SetProperty(candidate => candidate.DueDate, dueDate)
                        .SetProperty(candidate => candidate.Estimate, estimate)
                        .SetProperty(candidate => candidate.UpdatedAt, now), cancellationToken);
            }
        }

        var newTasks = request.Columns
            .SelectMany(column => column.Tasks
                .Where(task => !currentTaskIdSet.Contains(task.Id))
                .Select(task => new KanbanTask
                {
                    Id = task.Id,
                    Title = task.Title.Trim(),
                    Description = NormalizeDescription(task.Description),
                    Priority = task.Priority,
                    Position = task.Order,
                    ColumnId = column.Id,
                    ProjectId = boardId,
                    ReporterId = userId,
                    AssigneeId = task.AssigneeId,
                    DueDate = task.DueDate,
                    Estimate = task.Estimate,
                    CreatedAt = now,
                    UpdatedAt = now,
                }))
            .ToList();

        if (newTasks.Count > 0)
        {
            dbContext.KanbanTasks.AddRange(newTasks);
            await dbContext.SaveChangesAsync(cancellationToken);
            dbContext.ChangeTracker.Clear();
        }

        var after = request.Columns
            .SelectMany(column => column.Tasks.Select(task => new TaskState(
                task.Id,
                column.Id,
                task.Title.Trim(),
                NormalizeDescription(task.Description),
                task.Priority,
                task.AssigneeId,
                task.DueDate,
                task.Estimate)))
            .ToList();
        var historyEntries = historyService.BuildEntries(
            boardId, userId, now, beforeById, after, requestedColumnIdSet);
        await historyService.SaveAsync(historyEntries, cancellationToken);

        if (removedColumnIds.Length > 0)
        {
            await dbContext.Columns
                .Where(column => column.ProjectId == boardId && removedColumnIds.Contains(column.Id))
                .ExecuteDeleteAsync(cancellationToken);
        }

        // Shift every requested column out of the target range first so the unique
        // (ProjectId, SortOrder) index is never violated during a reorder.
        for (var index = 0; index < request.Columns.Count; index++)
        {
            var columnId = request.Columns[index].Id;
            var temporaryOrder = TemporaryColumnOrder + index;

            await dbContext.Columns
                .Where(column => column.Id == columnId && column.ProjectId == boardId)
                .ExecuteUpdateAsync(
                    updates => updates.SetProperty(column => column.SortOrder, temporaryOrder),
                    cancellationToken);
        }

        foreach (var requestedColumn in request.Columns)
        {
            var columnId = requestedColumn.Id;
            var name = requestedColumn.Title.Trim();
            var wipLimit = requestedColumn.WipLimit;
            var order = requestedColumn.Order;

            await dbContext.Columns
                .Where(column => column.Id == columnId && column.ProjectId == boardId)
                .ExecuteUpdateAsync(updates => updates
                    .SetProperty(column => column.Name, name)
                    .SetProperty(column => column.WipLimit, wipLimit)
                    .SetProperty(column => column.SortOrder, order), cancellationToken);
        }

        await transaction.CommitAsync(cancellationToken);

        return await GetAsync(boardId, userId, cancellationToken);
    }

    public async Task<AccessResult<bool>> DeleteAsync(
        Guid boardId,
        string userId,
        CancellationToken cancellationToken)
    {
        var role = await accessService.GetRoleAsync(boardId, userId, cancellationToken);
        if (role is null)
        {
            return AccessResult<bool>.NotFound;
        }

        if (role != ProjectMemberRole.Creator)
        {
            return AccessResult<bool>.Forbidden;
        }

        var project = await dbContext.Projects
            .SingleOrDefaultAsync(candidate => candidate.Id == boardId, cancellationToken);
        if (project is null)
        {
            return AccessResult<bool>.NotFound;
        }

        dbContext.Projects.Remove(project);
        await dbContext.SaveChangesAsync(cancellationToken);
        return AccessResult<bool>.Ok(true);
    }

    public async Task<AccessResult<bool>> SetVisibilityAsync(
        Guid boardId,
        string userId,
        bool isPublic,
        CancellationToken cancellationToken)
    {
        var role = await accessService.GetRoleAsync(boardId, userId, cancellationToken);
        if (role is null)
        {
            return AccessResult<bool>.NotFound;
        }

        if (role != ProjectMemberRole.Creator)
        {
            return AccessResult<bool>.Forbidden;
        }

        var updated = await dbContext.Projects
            .Where(project => project.Id == boardId)
            .ExecuteUpdateAsync(updates => updates
                .SetProperty(project => project.IsPublic, isPublic)
                .SetProperty(project => project.UpdatedAt, DateTime.UtcNow), cancellationToken);

        return updated == 0 ? AccessResult<bool>.NotFound : AccessResult<bool>.Ok(isPublic);
    }

    public async Task<PublicBoardResponse?> GetPublicAsync(Guid boardId, CancellationToken cancellationToken)
    {
        var project = await dbContext.Projects
            .AsNoTracking()
            .Where(candidate => candidate.Id == boardId && candidate.IsPublic)
            .Include(candidate => candidate.Columns.OrderBy(column => column.SortOrder))
            .ThenInclude(column => column.Tasks.OrderBy(task => task.Position))
            .ThenInclude(task => task.Assignee)
            .Include(candidate => candidate.Columns)
            .ThenInclude(column => column.Tasks)
            .ThenInclude(task => task.TaskTags)
            .ThenInclude(taskTag => taskTag.Tag)
            .AsSplitQuery()
            .SingleOrDefaultAsync(cancellationToken);

        return project is null ? null : ToPublicResponse(project);
    }

    private async Task<Project?> LoadProjectAsync(Guid boardId, CancellationToken cancellationToken) =>
        await dbContext.Projects
            .AsNoTracking()
            .Include(candidate => candidate.Members)
            .Include(candidate => candidate.Columns.OrderBy(column => column.SortOrder))
            .ThenInclude(column => column.Tasks.OrderBy(task => task.Position))
            .ThenInclude(task => task.Assignee)
            .Include(candidate => candidate.Columns)
            .ThenInclude(column => column.Tasks)
            .ThenInclude(task => task.TaskTags)
            .ThenInclude(taskTag => taskTag.Tag)
            .Include(candidate => candidate.Columns)
            .ThenInclude(column => column.Tasks)
            .ThenInclude(task => task.Comments)
            .AsSplitQuery()
            .SingleOrDefaultAsync(candidate => candidate.Id == boardId, cancellationToken);

    private async Task<HashSet<string>> GetParticipantIdsAsync(Guid boardId, CancellationToken cancellationToken)
    {
        var ownerId = await dbContext.Projects
            .AsNoTracking()
            .Where(project => project.Id == boardId)
            .Select(project => project.OwnerId)
            .SingleAsync(cancellationToken);

        var memberIds = await dbContext.ProjectMembers
            .AsNoTracking()
            .Where(member => member.ProjectId == boardId)
            .Select(member => member.UserId)
            .ToListAsync(cancellationToken);

        var ids = memberIds.ToHashSet();
        ids.Add(ownerId);
        return ids;
    }

    private static ProjectMemberRole? ResolveRole(Project project, string userId)
    {
        if (project.OwnerId == userId)
        {
            return ProjectMemberRole.Creator;
        }

        return project.Members.Any(member => member.UserId == userId)
            ? ProjectMemberRole.Member
            : null;
    }

    private static string? ValidateUpdate(UpdateBoardRequest request)
    {
        if (request.Title.Trim().Length < 2)
        {
            return "Название доски должно содержать не менее двух символов.";
        }

        if (request.Columns.Count == 0)
        {
            return "Доска должна содержать хотя бы одну колонку.";
        }

        if (request.Columns.Any(column => string.IsNullOrWhiteSpace(column.Title) || column.Title.Trim().Length > 100))
        {
            return "Название колонки должно содержать от 1 до 100 символов после удаления пробелов по краям.";
        }

        if (request.Columns.SelectMany(column => column.Tasks).Any(task => string.IsNullOrWhiteSpace(task.Title) || task.Title.Trim().Length > 200))
        {
            return "Название карточки должно содержать от 1 до 200 символов после удаления пробелов по краям.";
        }

        if (request.Columns.Any(column => column.Id == Guid.Empty) ||
            request.Columns.Select(column => column.Id).Distinct().Count() != request.Columns.Count ||
            !HasContiguousOrder(request.Columns.Select(column => column.Order), request.Columns.Count))
        {
            return "Идентификаторы и порядок колонок должны быть уникальными, а порядок — начинаться с нуля без пропусков.";
        }

        foreach (var column in request.Columns)
        {
            if (column.Id == Guid.Empty || column.Tasks.Any(task => task.Id == Guid.Empty) ||
                column.Tasks.Select(task => task.Id).Distinct().Count() != column.Tasks.Count ||
                !HasContiguousOrder(column.Tasks.Select(task => task.Order), column.Tasks.Count))
            {
                return "Идентификаторы карточек и их порядок внутри каждой колонки должны быть уникальными; порядок начинается с нуля без пропусков.";
            }

            if (column.WipLimit is <= 0)
            {
                return "WIP-лимит должен быть больше нуля или отсутствовать.";
            }

            if (column.WipLimit is int limit && column.Tasks.Count > limit)
            {
                return $"Колонка «{column.Title}» превышает WIP-лимит {limit}.";
            }

            if (column.Tasks.Any(task => !Enum.IsDefined(task.Priority)))
            {
                return "Указан неизвестный приоритет карточки.";
            }
        }

        return null;
    }

    private static List<KanbanColumn> CreateColumns(
        Guid projectId,
        string reporterId,
        DateTime now,
        (string Name, int? WipLimit, (string Title, string Description, TaskPriority Priority)[] Tasks)[] columns)
    {
        return columns.Select((column, columnIndex) =>
        {
            var boardColumn = new KanbanColumn
            {
                Name = column.Name,
                SortOrder = columnIndex,
                WipLimit = column.WipLimit,
                ProjectId = projectId,
            };

            boardColumn.Tasks = column.Tasks.Select((task, position) => new KanbanTask
            {
                Title = task.Title,
                Description = task.Description,
                Priority = task.Priority,
                Position = position,
                ColumnId = boardColumn.Id,
                ProjectId = projectId,
                ReporterId = reporterId,
                CreatedAt = now,
                UpdatedAt = now,
            }).ToList();

            return boardColumn;
        }).ToList();
    }

    private static bool HasContiguousOrder(IEnumerable<int> values, int count) =>
        values.Order().SequenceEqual(Enumerable.Range(0, count));

    private static string? NormalizeDescription(string? description) =>
        string.IsNullOrWhiteSpace(description) ? null : description.Trim();

    internal static BoardResponse ToResponse(Project project, ProjectMemberRole role) => new(
        project.Id,
        project.Name,
        project.Description ?? string.Empty,
        project.Version,
        role,
        project.IsPublic,
        project.Columns
            .OrderBy(column => column.SortOrder)
            .Select(column => new BoardColumnResponse(
                column.Id,
                column.Name,
                column.WipLimit,
                column.SortOrder,
                column.Tasks
                    .OrderBy(task => task.Position)
                    .Select(task => new BoardTaskResponse(
                        task.Id,
                        task.Title,
                        task.Description ?? string.Empty,
                        task.Priority,
                        task.Position,
                        task.AssigneeId,
                        task.Assignee?.DisplayName,
                        task.DueDate,
                        task.Estimate,
                        task.TaskTags
                            .Select(taskTag => new TagResponse(taskTag.Tag.Id, taskTag.Tag.Name, taskTag.Tag.Color))
                            .ToList(),
                        task.Comments.Count))
                    .ToList()))
            .ToList());

    private static PublicBoardResponse ToPublicResponse(Project project) => new(
        project.Id,
        project.Name,
        project.Description ?? string.Empty,
        project.Columns
            .OrderBy(column => column.SortOrder)
            .Select(column => new PublicBoardColumnResponse(
                column.Id,
                column.Name,
                column.WipLimit,
                column.SortOrder,
                column.Tasks
                    .OrderBy(task => task.Position)
                    .Select(task => new PublicBoardTaskResponse(
                        task.Id,
                        task.Title,
                        task.Description ?? string.Empty,
                        task.Priority,
                        task.Position,
                        task.Assignee?.DisplayName,
                        task.DueDate,
                        task.Estimate,
                        task.TaskTags
                            .Select(taskTag => new TagResponse(taskTag.Tag.Id, taskTag.Tag.Name, taskTag.Tag.Color))
                            .ToList()))
                    .ToList()))
            .ToList());
}

public sealed class BoardValidationException(string message) : Exception(message);
