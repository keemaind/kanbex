using Kanbex.Infrastructure.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Kanbex.Infrastructure.Persistence.Configurations;

public sealed class TagConfiguration : IEntityTypeConfiguration<Tag>
{
    public void Configure(EntityTypeBuilder<Tag> builder)
    {
        builder.ToTable("Tags", table =>
            table.HasCheckConstraint("CK_Tags_Name_NotEmpty", "length(trim(\"Name\")) > 0"));

        builder.HasKey(tag => tag.Id);
        builder.Property(tag => tag.Name).HasMaxLength(64).IsRequired();
        builder.Property(tag => tag.Color).HasMaxLength(7).IsRequired();
        builder.HasAlternateKey(tag => new { tag.Id, tag.ProjectId });
        builder.HasIndex(tag => new { tag.ProjectId, tag.Name }).IsUnique();

        builder.HasOne(tag => tag.Project)
            .WithMany(project => project.Tags)
            .HasForeignKey(tag => tag.ProjectId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
