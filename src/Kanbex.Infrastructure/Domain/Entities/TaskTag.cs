namespace Kanbex.Infrastructure.Domain.Entities;

public sealed class TaskTag
{
    public Guid TaskId { get; set; }

    public KanbanTask Task { get; set; } = null!;

    public Guid TagId { get; set; }

    public Tag Tag { get; set; } = null!;

    // Redundant by design: enables composite foreign keys that prevent
    // attaching a tag from a different project to a task.
    public Guid ProjectId { get; set; }
}
