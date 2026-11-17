namespace Kanbex.Infrastructure.Domain.Entities;

public sealed class KanbanColumn
{
    public Guid Id { get; set; } = Guid.NewGuid();

    public string Name { get; set; } = string.Empty;

    public int SortOrder { get; set; }

    public int? WipLimit { get; set; }

    public Guid ProjectId { get; set; }

    public Project Project { get; set; } = null!;

    public ICollection<KanbanTask> Tasks { get; set; } = new List<KanbanTask>();
}
