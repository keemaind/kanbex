namespace Kanbex.Infrastructure.Domain.Entities;

public sealed class Comment
{
    public Guid Id { get; set; } = Guid.NewGuid();

    public string Content { get; set; } = string.Empty;

    public Guid TaskId { get; set; }

    public KanbanTask Task { get; set; } = null!;

    public string AuthorId { get; set; } = string.Empty;

    public ApplicationUser Author { get; set; } = null!;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}
