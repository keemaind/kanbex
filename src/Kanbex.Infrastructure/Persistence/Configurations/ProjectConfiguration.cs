using Kanbex.Infrastructure.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Kanbex.Infrastructure.Persistence.Configurations;

public sealed class ProjectConfiguration : IEntityTypeConfiguration<Project>
{
    public void Configure(EntityTypeBuilder<Project> builder)
    {
        builder.ToTable("Projects", table =>
        {
            table.HasCheckConstraint("CK_Projects_Name_NotEmpty", "length(trim(\"Name\")) > 0");
            table.HasCheckConstraint("CK_Projects_Version_NonNegative", "\"Version\" >= 0");
        });

        builder.HasKey(project => project.Id);
        builder.Property(project => project.Name).HasMaxLength(120).IsRequired();
        builder.Property(project => project.Description).HasMaxLength(4000);
        builder.Property(project => project.OwnerId).IsRequired();
        builder.Property(project => project.CreatedAt).IsRequired();
        builder.Property(project => project.UpdatedAt).IsRequired();
        builder.Property(project => project.Version).IsConcurrencyToken();
        builder.HasAlternateKey(project => new { project.Id, project.OwnerId });

        builder.HasIndex(project => project.OwnerId);
        builder.HasOne(project => project.Owner)
            .WithMany()
            .HasForeignKey(project => project.OwnerId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
