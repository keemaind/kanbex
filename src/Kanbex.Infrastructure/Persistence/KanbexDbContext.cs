using Kanbex.Infrastructure.Domain.Entities;
using Kanbex.Infrastructure.Identity;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;

namespace Kanbex.Infrastructure.Persistence;

public sealed class KanbexDbContext(DbContextOptions<KanbexDbContext> options)
    : IdentityDbContext<ApplicationUser>(options)
{
    public DbSet<Project> Projects => Set<Project>();

    public DbSet<ProjectMember> ProjectMembers => Set<ProjectMember>();

    public DbSet<KanbanColumn> Columns => Set<KanbanColumn>();

    public DbSet<KanbanTask> KanbanTasks => Set<KanbanTask>();

    public DbSet<TaskHistory> TaskHistory => Set<TaskHistory>();

    public DbSet<Comment> Comments => Set<Comment>();

    public DbSet<Tag> Tags => Set<Tag>();

    public DbSet<TaskTag> TaskTags => Set<TaskTag>();

    protected override void OnModelCreating(ModelBuilder builder)
    {
        base.OnModelCreating(builder);

        builder.Entity<ApplicationUser>().ToTable("ApplicationUsers");
        builder.Entity<Microsoft.AspNetCore.Identity.IdentityRole>().ToTable("IdentityRoles");
        builder.Entity<Microsoft.AspNetCore.Identity.IdentityUserRole<string>>().ToTable("UserRoles");
        builder.Entity<Microsoft.AspNetCore.Identity.IdentityUserClaim<string>>().ToTable("UserClaims");
        builder.Entity<Microsoft.AspNetCore.Identity.IdentityRoleClaim<string>>().ToTable("RoleClaims");
        builder.Entity<Microsoft.AspNetCore.Identity.IdentityUserLogin<string>>().ToTable("UserLogins");
        builder.Entity<Microsoft.AspNetCore.Identity.IdentityUserToken<string>>().ToTable("UserTokens");

        builder.ApplyConfigurationsFromAssembly(typeof(KanbexDbContext).Assembly);

        builder.Entity<Microsoft.AspNetCore.Identity.IdentityRole>().HasData(
            new Microsoft.AspNetCore.Identity.IdentityRole
            {
                Id = "9f8db0c4-34be-4c3d-91bf-29194b84f701",
                Name = IdentityRoleNames.Administrator,
                NormalizedName = "ADMIN",
                ConcurrencyStamp = "7e9554c8-8d38-4b6f-9585-d7e8e3758b01"
            },
            new Microsoft.AspNetCore.Identity.IdentityRole
            {
                Id = "9f8db0c4-34be-4c3d-91bf-29194b84f702",
                Name = IdentityRoleNames.User,
                NormalizedName = "USER",
                ConcurrencyStamp = "7e9554c8-8d38-4b6f-9585-d7e8e3758b02"
            });
    }
}
