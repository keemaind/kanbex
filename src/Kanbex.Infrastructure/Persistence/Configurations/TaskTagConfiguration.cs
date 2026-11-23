using Kanbex.Infrastructure.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Kanbex.Infrastructure.Persistence.Configurations;

public sealed class TaskTagConfiguration : IEntityTypeConfiguration<TaskTag>
{
    public void Configure(EntityTypeBuilder<TaskTag> builder)
    {
        builder.ToTable("TaskTags");

        builder.HasKey(taskTag => new { taskTag.TaskId, taskTag.TagId });
        builder.HasIndex(taskTag => new { taskTag.TagId, taskTag.TaskId }).IsUnique();

        builder.HasOne(taskTag => taskTag.Task)
            .WithMany(task => task.TaskTags)
            .HasForeignKey(taskTag => new { taskTag.TaskId, taskTag.ProjectId })
            .HasPrincipalKey(task => new { task.Id, task.ProjectId })
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(taskTag => taskTag.Tag)
            .WithMany(tag => tag.TaskTags)
            .HasForeignKey(taskTag => new { taskTag.TagId, taskTag.ProjectId })
            .HasPrincipalKey(tag => new { tag.Id, tag.ProjectId })
            .OnDelete(DeleteBehavior.Cascade);
    }
}
