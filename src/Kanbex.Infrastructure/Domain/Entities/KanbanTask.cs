using Kanbex.Infrastructure.Domain.Enums;

namespace Kanbex.Infrastructure.Domain.Entities;

public sealed class KanbanTask
{
    public Guid Id { get; set; } = Guid.NewGuid();

    public string Title { get; set; } = string.Empty;

    public string? Description { get; set; }

    public TaskPriority Priority { get; set; } = TaskPriority.Medium;

    public int Position { get; set; }

    public Guid ColumnId { get; set; }

    public KanbanColumn Column { get; set; } = null!;

    public Guid ProjectId { get; set; }

    public Project Project { get; set; } = null!;

    public string? AssigneeId { get; set; }

    public ApplicationUser? Assignee { get; set; }

    public string ReporterId { get; set; } = string.Empty;

    public ApplicationUser Reporter { get; set; } = null!;

    public DateTime? DueDate { get; set; }

    public int? Estimate { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    public ICollection<TaskHistory> History { get; set; } = new List<TaskHistory>();

    public ICollection<Comment> Comments { get; set; } = new List<Comment>();

    public ICollection<TaskTag> TaskTags { get; set; } = new List<TaskTag>();
}
