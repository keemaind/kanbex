namespace Kanbex.Infrastructure.Domain.Entities;

public sealed class Project
{
    public Guid Id { get; set; } = Guid.NewGuid();

    public string Name { get; set; } = string.Empty;

    public string? Description { get; set; }

    public bool IsPublic { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    public int Version { get; set; }

    public string OwnerId { get; set; } = string.Empty;

    public ApplicationUser Owner { get; set; } = null!;

    public ICollection<ProjectMember> Members { get; set; } = new List<ProjectMember>();

    public ICollection<KanbanColumn> Columns { get; set; } = new List<KanbanColumn>();

    public ICollection<KanbanTask> Tasks { get; set; } = new List<KanbanTask>();

    public ICollection<Tag> Tags { get; set; } = new List<Tag>();
}
