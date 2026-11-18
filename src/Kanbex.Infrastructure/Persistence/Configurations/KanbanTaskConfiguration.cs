using Kanbex.Infrastructure.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Kanbex.Infrastructure.Persistence.Configurations;

public sealed class KanbanTaskConfiguration : IEntityTypeConfiguration<KanbanTask>
{
    public void Configure(EntityTypeBuilder<KanbanTask> builder)
    {
        builder.ToTable("KanbanTasks", table =>
        {
            table.HasCheckConstraint("CK_KanbanTasks_Title_NotEmpty", "length(trim(\"Title\")) > 0");
            table.HasCheckConstraint("CK_KanbanTasks_Position_NonNegative", "\"Position\" >= 0");
            table.HasCheckConstraint("CK_KanbanTasks_Estimate_NonNegative", "\"Estimate\" IS NULL OR \"Estimate\" >= 0");
        });

        builder.HasKey(task => task.Id);
        builder.Property(task => task.Title).HasMaxLength(200).IsRequired();
        builder.Property(task => task.Description).HasMaxLength(10000);
        builder.Property(task => task.Priority).HasConversion<string>().HasMaxLength(16).IsRequired();
        builder.Property(task => task.Estimate).HasComment("Estimate in relative story points.");
        builder.Property(task => task.CreatedAt).IsRequired();
        builder.Property(task => task.UpdatedAt).IsRequired();
        builder.HasAlternateKey(task => new { task.Id, task.ProjectId });
        builder.HasAlternateKey(task => new { task.Id, task.ColumnId, task.ProjectId });

        builder.HasIndex(task => new { task.ColumnId, task.Position });
        builder.HasIndex(task => task.ProjectId);
        builder.HasIndex(task => task.AssigneeId);
        builder.HasIndex(task => task.ReporterId);

        builder.HasOne(task => task.Project)
            .WithMany(project => project.Tasks)
            .HasForeignKey(task => task.ProjectId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(task => task.Column)
            .WithMany(column => column.Tasks)
            .HasForeignKey(task => new { task.ColumnId, task.ProjectId })
            .HasPrincipalKey(column => new { column.Id, column.ProjectId })
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(task => task.Assignee)
            .WithMany()
            .HasForeignKey(task => task.AssigneeId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(task => task.Reporter)
            .WithMany()
            .HasForeignKey(task => task.ReporterId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
