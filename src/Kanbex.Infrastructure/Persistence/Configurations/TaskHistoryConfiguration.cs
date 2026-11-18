using Kanbex.Infrastructure.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Kanbex.Infrastructure.Persistence.Configurations;

public sealed class TaskHistoryConfiguration : IEntityTypeConfiguration<TaskHistory>
{
    public void Configure(EntityTypeBuilder<TaskHistory> builder)
    {
        builder.ToTable("TaskHistory");

        builder.HasKey(history => history.Id);
        builder.Property(history => history.EventType).HasConversion<string>().HasMaxLength(16).IsRequired();
        builder.Property(history => history.Details).HasMaxLength(4000);
        builder.Property(history => history.ChangedAt).IsRequired();

        builder.HasIndex(history => new { history.TaskId, history.ChangedAt });
        builder.HasIndex(history => history.ChangedById);
        builder.HasAlternateKey(history => new { history.Id, history.TaskId });

        builder.HasOne(history => history.Task)
            .WithMany(task => task.History)
            .HasForeignKey(history => new { history.TaskId, history.ProjectId })
            .HasPrincipalKey(task => new { task.Id, task.ProjectId })
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(history => history.OldColumn)
            .WithMany()
            .HasForeignKey(history => new { history.OldColumnId, history.ProjectId })
            .HasPrincipalKey(column => new { column.Id, column.ProjectId })
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(history => history.NewColumn)
            .WithMany()
            .HasForeignKey(history => new { history.NewColumnId, history.ProjectId })
            .HasPrincipalKey(column => new { column.Id, column.ProjectId })
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(history => history.ChangedBy)
            .WithMany()
            .HasForeignKey(history => history.ChangedById)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
