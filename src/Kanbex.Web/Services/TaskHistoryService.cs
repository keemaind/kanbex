using Kanbex.Infrastructure.Domain.Entities;
using Kanbex.Infrastructure.Domain.Enums;
using Kanbex.Infrastructure.Persistence;
using Kanbex.Web.Contracts;
using Microsoft.EntityFrameworkCore;

namespace Kanbex.Web.Services;

/// <summary>Снимок карточки до сохранения: по нему считается diff для истории.</summary>
public sealed record TaskState(
    Guid Id,
    Guid ColumnId,
    string Title,
    string? Description,
    TaskPriority Priority,
    string? AssigneeId,
    DateTime? DueDate,
    int? Estimate);

/// <summary>
/// Пишет историю задачи в той же транзакции, что и сохранение доски.
/// Сравнивает старое и новое состояние, чтобы не дублировать события:
/// перемещение даёт `Moved`, смена исполнителя — `Assigned`, остальные
/// изменения полей — одно событие `Updated`.
/// </summary>
public sealed class TaskHistoryService(KanbexDbContext dbContext)
{
    public IReadOnlyList<TaskHistory> BuildEntries(
        Guid boardId,
        string userId,
        DateTime now,
        IReadOnlyDictionary<Guid, TaskState> before,
        IReadOnlyList<TaskState> after,
        ISet<Guid> survivingColumnIds)
    {
        var entries = new List<TaskHistory>();

        foreach (var task in after)
        {
            if (!before.TryGetValue(task.Id, out var previous))
            {
                entries.Add(Create(boardId, userId, now, task.Id, TaskHistoryEventType.Created, null, null,
                    task.Title));

                if (task.AssigneeId is not null)
                {
                    entries.Add(Create(boardId, userId, now, task.Id, TaskHistoryEventType.Assigned, null, null,
                        task.AssigneeId));
                }

                continue;
            }

            var columnChanged = previous.ColumnId != task.ColumnId;
            var assigneeChanged = previous.AssigneeId != task.AssigneeId;

            if (columnChanged)
            {
                entries.Add(Create(boardId, userId, now, task.Id, TaskHistoryEventType.Moved,
                    survivingColumnIds.Contains(previous.ColumnId) ? previous.ColumnId : null,
                    survivingColumnIds.Contains(task.ColumnId) ? task.ColumnId : null,
                    null));
            }

            if (assigneeChanged)
            {
                entries.Add(Create(boardId, userId, now, task.Id, TaskHistoryEventType.Assigned, null, null,
                    task.AssigneeId));
            }

            var fieldsChanged =
                previous.Title != task.Title ||
                previous.Description != task.Description ||
                previous.Priority != task.Priority ||
                previous.DueDate != task.DueDate ||
                previous.Estimate != task.Estimate;

            if (fieldsChanged)
            {
                entries.Add(Create(boardId, userId, now, task.Id, TaskHistoryEventType.Updated, null, null,
                    DescribeChanges(previous, task)));
            }
        }

        return entries;
    }

    public async Task<IReadOnlyList<TaskHistoryResponse>?> ListAsync(
        Guid boardId,
        Guid taskId,
        CancellationToken cancellationToken)
    {
        var taskExists = await dbContext.KanbanTasks
            .AsNoTracking()
            .AnyAsync(task => task.Id == taskId && task.ProjectId == boardId, cancellationToken);
        if (!taskExists)
        {
            return null;
        }

        return await dbContext.TaskHistory
            .AsNoTracking()
            .Where(history => history.TaskId == taskId && history.ProjectId == boardId)
            .OrderBy(history => history.ChangedAt)
            .Select(history => new TaskHistoryResponse(
                history.Id,
                history.TaskId,
                history.EventType,
                history.ChangedById,
                history.ChangedBy.DisplayName,
                history.OldColumnId,
                history.NewColumnId,
                history.Details,
                history.ChangedAt))
            .ToListAsync(cancellationToken);
    }

    public async Task SaveAsync(IEnumerable<TaskHistory> entries, CancellationToken cancellationToken)
    {
        var list = entries.ToList();
        if (list.Count == 0)
        {
            return;
        }

        dbContext.TaskHistory.AddRange(list);
        await dbContext.SaveChangesAsync(cancellationToken);
        dbContext.ChangeTracker.Clear();
    }

    private static TaskHistory Create(
        Guid boardId,
        string userId,
        DateTime now,
        Guid taskId,
        TaskHistoryEventType eventType,
        Guid? oldColumnId,
        Guid? newColumnId,
        string? details) => new()
        {
            TaskId = taskId,
            ProjectId = boardId,
            ChangedById = userId,
            EventType = eventType,
            OldColumnId = oldColumnId,
            NewColumnId = newColumnId,
            Details = details,
            ChangedAt = now,
        };

    private static string DescribeChanges(TaskState previous, TaskState current)
    {
        var changes = new List<string>();
        if (previous.Title != current.Title) changes.Add("title");
        if (previous.Description != current.Description) changes.Add("description");
        if (previous.Priority != current.Priority) changes.Add("priority");
        if (previous.DueDate != current.DueDate) changes.Add("dueDate");
        if (previous.Estimate != current.Estimate) changes.Add("estimate");
        return string.Join(", ", changes);
    }
}
