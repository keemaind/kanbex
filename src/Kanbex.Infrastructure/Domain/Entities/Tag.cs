namespace Kanbex.Infrastructure.Domain.Entities;

public sealed class Tag
{
    public Guid Id { get; set; } = Guid.NewGuid();

    public string Name { get; set; } = string.Empty;

    public string Color { get; set; } = string.Empty;

    public Guid ProjectId { get; set; }

    public Project Project { get; set; } = null!;

    public ICollection<TaskTag> TaskTags { get; set; } = new List<TaskTag>();
}
