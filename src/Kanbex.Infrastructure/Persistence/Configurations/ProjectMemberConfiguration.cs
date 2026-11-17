using Kanbex.Infrastructure.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Kanbex.Infrastructure.Persistence.Configurations;

public sealed class ProjectMemberConfiguration : IEntityTypeConfiguration<ProjectMember>
{
    public void Configure(EntityTypeBuilder<ProjectMember> builder)
    {
        builder.ToTable("ProjectMembers");

        builder.HasKey(member => member.Id);
        builder.Property(member => member.Role).HasConversion<string>().HasMaxLength(24).IsRequired();
        builder.Property(member => member.JoinedAt).IsRequired();

        builder.HasIndex(member => new { member.ProjectId, member.UserId }).IsUnique();
        builder.HasIndex(member => member.UserId);

        builder.HasOne(member => member.Project)
            .WithMany(project => project.Members)
            .HasForeignKey(member => member.ProjectId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(member => member.User)
            .WithMany()
            .HasForeignKey(member => member.UserId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
