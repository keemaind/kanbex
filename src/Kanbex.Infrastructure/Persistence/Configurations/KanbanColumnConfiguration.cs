using Kanbex.Infrastructure.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Kanbex.Infrastructure.Persistence.Configurations;

public sealed class KanbanColumnConfiguration : IEntityTypeConfiguration<KanbanColumn>
{
    public void Configure(EntityTypeBuilder<KanbanColumn> builder)
    {
        builder.ToTable("Columns", table =>
        {
            table.HasCheckConstraint("CK_Columns_Name_NotEmpty", "length(trim(\"Name\")) > 0");
            table.HasCheckConstraint("CK_Columns_SortOrder_NonNegative", "\"SortOrder\" >= 0");
            table.HasCheckConstraint("CK_Columns_WipLimit_Positive", "\"WipLimit\" IS NULL OR \"WipLimit\" > 0");
        });

        builder.HasKey(column => column.Id);
        builder.Property(column => column.Name).HasMaxLength(100).IsRequired();
        builder.HasAlternateKey(column => new { column.Id, column.ProjectId });
        builder.HasIndex(column => new { column.ProjectId, column.SortOrder }).IsUnique();

        builder.HasOne(column => column.Project)
            .WithMany(project => project.Columns)
            .HasForeignKey(column => column.ProjectId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
