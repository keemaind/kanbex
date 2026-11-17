using Kanbex.Infrastructure.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Kanbex.Infrastructure.Persistence.Configurations;

public sealed class CommentConfiguration : IEntityTypeConfiguration<Comment>
{
    public void Configure(EntityTypeBuilder<Comment> builder)
    {
        builder.ToTable("Comments", table =>
            table.HasCheckConstraint("CK_Comments_Content_NotEmpty", "length(trim(\"Content\")) > 0"));

        builder.HasKey(comment => comment.Id);
        builder.Property(comment => comment.Content).HasMaxLength(4000).IsRequired();
        builder.Property(comment => comment.CreatedAt).IsRequired();
        builder.Property(comment => comment.UpdatedAt).IsRequired();

        builder.HasIndex(comment => new { comment.TaskId, comment.CreatedAt });
        builder.HasIndex(comment => comment.AuthorId);

        builder.HasOne(comment => comment.Task)
            .WithMany(task => task.Comments)
            .HasForeignKey(comment => comment.TaskId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(comment => comment.Author)
            .WithMany()
            .HasForeignKey(comment => comment.AuthorId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
