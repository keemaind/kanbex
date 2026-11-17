using Kanbex.Infrastructure.Domain.Enums;

namespace Kanbex.Infrastructure.Domain.Entities;

public sealed class TaskHistory
{
    public Guid Id { get; set; } = Guid.NewGuid();

    public Guid TaskId { get; set; }

    public Guid ProjectId { get; set; }

    public KanbanTask Task { get; set; } = null!;

    public Guid? OldColumnId { get; set; }

    public KanbanColumn? OldColumn { get; set; }

    public Guid? NewColumnId { get; set; }

    public KanbanColumn? NewColumn { get; set; }

    public string ChangedById { get; set; } = string.Empty;

    public ApplicationUser ChangedBy { get; set; } = null!;

    public TaskHistoryEventType EventType { get; set; }

    public string? Details { get; set; }

    public DateTime ChangedAt { get; set; } = DateTime.UtcNow;
}
