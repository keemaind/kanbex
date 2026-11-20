using Kanbex.Infrastructure.Domain.Entities;
using Kanbex.Infrastructure.Domain.Enums;
using Kanbex.Infrastructure.Persistence;
using Kanbex.Web.Contracts;
using Microsoft.EntityFrameworkCore;

namespace Kanbex.Web.Services;

public sealed class BoardService(KanbexDbContext dbContext)
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

    public async Task<IReadOnlyList<BoardSummaryResponse>> ListAsync(string ownerId, CancellationToken cancellationToken)
    {
        var projects = await dbContext.Projects
            .AsNoTracking()
            .Where(project => project.OwnerId == ownerId)
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
                lastColumn?.Tasks.Count ?? 0);
        }).ToList();
    }

    public async Task<BoardResponse?> GetAsync(Guid boardId, string ownerId, CancellationToken cancellationToken)
    {
        var project = await dbContext.Projects
            .AsNoTracking()
            .Include(candidate => candidate.Columns.OrderBy(column => column.SortOrder))
            .ThenInclude(column => column.Tasks.OrderBy(task => task.Position))
            .SingleOrDefaultAsync(candidate => candidate.Id == boardId && candidate.OwnerId == ownerId, cancellationToken);

        return project is null ? null : ToResponse(project);
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

        project.Columns = CreateInitialColumns(project.Id, ownerId, now);

        dbContext.Projects.Add(project);
        await dbContext.SaveChangesAsync(cancellationToken);
        return ToResponse(project);
    }

    public async Task<BoardResponse?> ResetAsync(Guid boardId, string ownerId, CancellationToken cancellationToken)
    {
        var project = await dbContext.Projects
            .AsNoTracking()
            .SingleOrDefaultAsync(candidate => candidate.Id == boardId && candidate.OwnerId == ownerId, cancellationToken);

        if (project is null)
        {
            return null;
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
            .Where(candidate => candidate.Id == boardId && candidate.OwnerId == ownerId)
            .ExecuteUpdateAsync(updates => updates
                .SetProperty(candidate => candidate.UpdatedAt, now)
                .SetProperty(candidate => candidate.Version, candidate => candidate.Version + 1), cancellationToken);

        if (updatedRows == 0)
        {
            await transaction.RollbackAsync(cancellationToken);
            return null;
        }

        dbContext.Columns.AddRange(CreateInitialColumns(boardId, ownerId, now));
        await dbContext.SaveChangesAsync(cancellationToken);
        dbContext.ChangeTracker.Clear();

        await transaction.CommitAsync(cancellationToken);

        return await GetAsync(boardId, ownerId, cancellationToken);
    }

    public async Task<BoardUpdateResult> UpdateAsync(
        Guid boardId,
        string ownerId,
        UpdateBoardRequest request,
        CancellationToken cancellationToken)
    {
        var project = await dbContext.Projects
            .AsNoTracking()
            .SingleOrDefaultAsync(candidate => candidate.Id == boardId && candidate.OwnerId == ownerId, cancellationToken);

        if (project is null)
        {
            return BoardUpdateResult.NotFound;
        }

        if (project.Version != request.Version)
        {
            return BoardUpdateResult.Conflict;
        }

        if (request.Columns.Any(column => column.WipLimit is int limit && column.Tasks.Count > limit))
        {
            return BoardUpdateResult.Conflict;
        }

        var validationError = ValidateUpdate(request);
        if (validationError is not null)
        {
            throw new BoardValidationException(validationError);
        }

        var requestedColumnIds = request.Columns.Select(column => column.Id).ToArray();
        var requestedTasks = request.Columns.SelectMany(column => column.Tasks).ToList();
        var requestedTaskIds = requestedTasks.Select(task => task.Id).ToArray();

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

        var updatedRows = await dbContext.Projects
            .Where(candidate => candidate.Id == boardId && candidate.OwnerId == ownerId && candidate.Version == request.Version)
            .ExecuteUpdateAsync(updates => updates
                .SetProperty(candidate => candidate.Name, request.Title.Trim())
                .SetProperty(candidate => candidate.Description, NormalizeDescription(request.Description))
                .SetProperty(candidate => candidate.UpdatedAt, now)
                .SetProperty(candidate => candidate.Version, candidate => candidate.Version + 1), cancellationToken);

        if (updatedRows == 0)
        {
            await transaction.RollbackAsync(cancellationToken);
            return BoardUpdateResult.Conflict;
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

                await dbContext.KanbanTasks
                    .Where(candidate => candidate.Id == taskId && candidate.ProjectId == boardId)
                    .ExecuteUpdateAsync(updates => updates
                        .SetProperty(candidate => candidate.Title, title)
                        .SetProperty(candidate => candidate.Description, description)
                        .SetProperty(candidate => candidate.Priority, priority)
                        .SetProperty(candidate => candidate.Position, position)
                        .SetProperty(candidate => candidate.ColumnId, columnId)
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
                    ReporterId = ownerId,
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

        var updatedBoard = await GetAsync(boardId, ownerId, cancellationToken);
        return updatedBoard is null ? BoardUpdateResult.NotFound : BoardUpdateResult.Updated(updatedBoard);
    }

    public async Task<bool> DeleteAsync(Guid boardId, string ownerId, CancellationToken cancellationToken)
    {
        var project = await dbContext.Projects
            .SingleOrDefaultAsync(candidate => candidate.Id == boardId && candidate.OwnerId == ownerId, cancellationToken);
        if (project is null)
        {
            return false;
        }

        dbContext.Projects.Remove(project);
        await dbContext.SaveChangesAsync(cancellationToken);
        return true;
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

    private static List<KanbanColumn> CreateInitialColumns(Guid projectId, string reporterId, DateTime now)
    {
        return InitialBoard.Select((column, columnIndex) =>
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

    private static BoardResponse ToResponse(Project project) => new(
        project.Id,
        project.Name,
        project.Description ?? string.Empty,
        project.Version,
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
                        task.Position))
                    .ToList()))
            .ToList());
}

public sealed class BoardValidationException(string message) : Exception(message);

public sealed record BoardUpdateResult(BoardResponse? Board, bool IsNotFound, bool IsConflict)
{
    public static BoardUpdateResult NotFound { get; } = new(null, true, false);
    public static BoardUpdateResult Conflict { get; } = new(null, false, true);
    public static BoardUpdateResult Updated(BoardResponse board) => new(board, false, false);
}
