using Microsoft.AspNetCore.Identity;

namespace Kanbex.Infrastructure.Identity;

public sealed class ApplicationUser : IdentityUser
{
    public string DisplayName { get; set; } = string.Empty;

    public string? AvatarUrl { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
